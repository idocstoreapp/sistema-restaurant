-- =====================================================
-- MIGRACIÓN 002: TABLAS DE RECETAS
-- =====================================================
-- Ejecutar en Supabase SQL Editor

-- Tabla de recetas
CREATE TABLE IF NOT EXISTS recetas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  porciones INTEGER DEFAULT 1,
  costo_total NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla pivote receta_ingredientes
CREATE TABLE IF NOT EXISTS receta_ingredientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receta_id UUID REFERENCES recetas(id) ON DELETE CASCADE,
  ingrediente_id UUID REFERENCES ingredientes(id) ON DELETE CASCADE,
  cantidad NUMERIC NOT NULL,
  unidad_medida TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(receta_id, ingrediente_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_recetas_menu_item ON recetas(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_receta_ingredientes_receta ON receta_ingredientes(receta_id);
CREATE INDEX IF NOT EXISTS idx_receta_ingredientes_ingrediente ON receta_ingredientes(ingrediente_id);

-- Trigger para updated_at en recetas
CREATE OR REPLACE FUNCTION update_recetas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_recetas_updated_at ON recetas;

CREATE TRIGGER trigger_update_recetas_updated_at
    BEFORE UPDATE ON recetas
    FOR EACH ROW
    EXECUTE FUNCTION update_recetas_updated_at();

-- Trigger para actualizar costo_total de receta
CREATE OR REPLACE FUNCTION actualizar_costo_receta()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE recetas
  SET costo_total = (
    SELECT COALESCE(SUM(ri.cantidad * i.precio_unitario), 0)
    FROM receta_ingredientes ri
    JOIN ingredientes i ON i.id = ri.ingrediente_id
    WHERE ri.receta_id = COALESCE(NEW.receta_id, OLD.receta_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.receta_id, OLD.receta_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_actualizar_costo_receta ON receta_ingredientes;

CREATE TRIGGER trigger_actualizar_costo_receta
  AFTER INSERT OR UPDATE OR DELETE ON receta_ingredientes
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_costo_receta();

-- RLS
ALTER TABLE recetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE receta_ingredientes ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas si existen
DROP POLICY IF EXISTS "recetas_select_all" ON recetas;
DROP POLICY IF EXISTS "recetas_insert_admin" ON recetas;
DROP POLICY IF EXISTS "recetas_update_admin" ON recetas;
DROP POLICY IF EXISTS "recetas_delete_admin" ON recetas;
DROP POLICY IF EXISTS "receta_ingredientes_select_all" ON receta_ingredientes;
DROP POLICY IF EXISTS "receta_ingredientes_insert_admin" ON receta_ingredientes;
DROP POLICY IF EXISTS "receta_ingredientes_update_admin" ON receta_ingredientes;
DROP POLICY IF EXISTS "receta_ingredientes_delete_admin" ON receta_ingredientes;

-- Políticas para recetas
CREATE POLICY "recetas_select_all"
  ON recetas FOR SELECT
  USING (true);

CREATE POLICY "recetas_insert_admin"
  ON recetas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

CREATE POLICY "recetas_update_admin"
  ON recetas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

CREATE POLICY "recetas_delete_admin"
  ON recetas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- Políticas para receta_ingredientes
CREATE POLICY "receta_ingredientes_select_all"
  ON receta_ingredientes FOR SELECT
  USING (true);

CREATE POLICY "receta_ingredientes_insert_admin"
  ON receta_ingredientes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

CREATE POLICY "receta_ingredientes_update_admin"
  ON receta_ingredientes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

CREATE POLICY "receta_ingredientes_delete_admin"
  ON receta_ingredientes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

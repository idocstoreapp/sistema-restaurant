-- =====================================================
-- MIGRACIÓN 005: TABLAS DE COMPRAS
-- =====================================================
-- Ejecutar en Supabase SQL Editor

-- Tabla de compras
CREATE TABLE IF NOT EXISTS compras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_factura TEXT,
  proveedor_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  fecha DATE NOT NULL,
  total NUMERIC NOT NULL DEFAULT 0,
  metodo_pago TEXT CHECK (metodo_pago IN ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CREDITO')),
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagada', 'cancelada')),
  notas TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla pivote compra_items
CREATE TABLE IF NOT EXISTS compra_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compra_id UUID REFERENCES compras(id) ON DELETE CASCADE,
  ingrediente_id UUID REFERENCES ingredientes(id) ON DELETE CASCADE,
  cantidad NUMERIC NOT NULL,
  precio_unitario NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_compras_proveedor ON compras(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_compras_fecha ON compras(fecha);
CREATE INDEX IF NOT EXISTS idx_compras_estado ON compras(estado);
CREATE INDEX IF NOT EXISTS idx_compra_items_compra ON compra_items(compra_id);
CREATE INDEX IF NOT EXISTS idx_compra_items_ingrediente ON compra_items(ingrediente_id);

-- Trigger para actualizar total de compra
CREATE OR REPLACE FUNCTION actualizar_total_compra()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE compras
  SET total = (
    SELECT COALESCE(SUM(subtotal), 0)
    FROM compra_items
    WHERE compra_id = COALESCE(NEW.compra_id, OLD.compra_id)
  )
  WHERE id = COALESCE(NEW.compra_id, OLD.compra_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_actualizar_total_compra ON compra_items;

CREATE TRIGGER trigger_actualizar_total_compra
  AFTER INSERT OR UPDATE OR DELETE ON compra_items
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_total_compra();

-- RLS
ALTER TABLE compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE compra_items ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas si existen
DROP POLICY IF EXISTS "compras_select_admin" ON compras;
DROP POLICY IF EXISTS "compras_insert_admin" ON compras;
DROP POLICY IF EXISTS "compras_update_admin" ON compras;
DROP POLICY IF EXISTS "compras_delete_admin" ON compras;
DROP POLICY IF EXISTS "compra_items_select_admin" ON compra_items;
DROP POLICY IF EXISTS "compra_items_insert_admin" ON compra_items;
DROP POLICY IF EXISTS "compra_items_update_admin" ON compra_items;
DROP POLICY IF EXISTS "compra_items_delete_admin" ON compra_items;

-- Políticas para compras
CREATE POLICY "compras_select_admin"
  ON compras FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'encargado')
    )
  );

CREATE POLICY "compras_insert_admin"
  ON compras FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'encargado')
    )
  );

CREATE POLICY "compras_update_admin"
  ON compras FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'encargado')
    )
  );

CREATE POLICY "compras_delete_admin"
  ON compras FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- Políticas para compra_items
CREATE POLICY "compra_items_select_admin"
  ON compra_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM compras c
      JOIN users u ON u.id = auth.uid()
      WHERE c.id = compra_items.compra_id
      AND u.role IN ('admin', 'encargado')
    )
  );

CREATE POLICY "compra_items_insert_admin"
  ON compra_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM compras c
      JOIN users u ON u.id = auth.uid()
      WHERE c.id = compra_items.compra_id
      AND u.role IN ('admin', 'encargado')
    )
  );

CREATE POLICY "compra_items_update_admin"
  ON compra_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM compras c
      JOIN users u ON u.id = auth.uid()
      WHERE c.id = compra_items.compra_id
      AND u.role IN ('admin', 'encargado')
    )
  );

CREATE POLICY "compra_items_delete_admin"
  ON compra_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM compras c
      JOIN users u ON u.id = auth.uid()
      WHERE c.id = compra_items.compra_id
      AND u.role = 'admin'
    )
  );


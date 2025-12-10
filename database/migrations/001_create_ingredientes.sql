-- =====================================================
-- MIGRACIÓN 001: TABLA DE INGREDIENTES
-- =====================================================
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS ingredientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  unidad_medida TEXT NOT NULL CHECK (unidad_medida IN ('kg', 'gr', 'lt', 'ml', 'un')),
  precio_unitario NUMERIC NOT NULL DEFAULT 0,
  stock_actual NUMERIC NOT NULL DEFAULT 0,
  stock_minimo NUMERIC DEFAULT 0,
  proveedor_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ingredientes_proveedor ON ingredientes(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_ingredientes_stock ON ingredientes(stock_actual);
CREATE INDEX IF NOT EXISTS idx_ingredientes_nombre ON ingredientes(nombre);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_ingredientes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger si existe antes de crearlo
DROP TRIGGER IF EXISTS trigger_update_ingredientes_updated_at ON ingredientes;

CREATE TRIGGER trigger_update_ingredientes_updated_at
    BEFORE UPDATE ON ingredientes
    FOR EACH ROW
    EXECUTE FUNCTION update_ingredientes_updated_at();

-- RLS
ALTER TABLE ingredientes ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas si existen antes de crearlas
DROP POLICY IF EXISTS "ingredientes_select_all" ON ingredientes;
DROP POLICY IF EXISTS "ingredientes_insert_admin" ON ingredientes;
DROP POLICY IF EXISTS "ingredientes_update_admin" ON ingredientes;
DROP POLICY IF EXISTS "ingredientes_delete_admin" ON ingredientes;

CREATE POLICY "ingredientes_select_all"
  ON ingredientes FOR SELECT
  USING (true);

CREATE POLICY "ingredientes_insert_admin"
  ON ingredientes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
    OR NOT EXISTS (SELECT 1 FROM users LIMIT 1) -- Permitir si no hay usuarios aún
  );

CREATE POLICY "ingredientes_update_admin"
  ON ingredientes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
    OR NOT EXISTS (SELECT 1 FROM users LIMIT 1)
  );

CREATE POLICY "ingredientes_delete_admin"
  ON ingredientes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
    OR NOT EXISTS (SELECT 1 FROM users LIMIT 1)
  );

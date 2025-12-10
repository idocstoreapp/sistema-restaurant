-- =====================================================
-- MIGRACIÓN 007: TABLAS DE GASTOS
-- =====================================================
-- Ejecutar en Supabase SQL Editor
-- NOTA: users, suppliers y branches ya fueron creados en la migración 000

-- Tabla de gastos hormiga (si no existe)
CREATE TABLE IF NOT EXISTS small_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sucursal_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL,
  monto NUMERIC NOT NULL,
  fecha DATE NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de gastos generales (si no existe)
CREATE TABLE IF NOT EXISTS general_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sucursal_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL,
  monto NUMERIC NOT NULL,
  fecha DATE NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_small_expenses_sucursal ON small_expenses(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_small_expenses_fecha ON small_expenses(fecha);
CREATE INDEX IF NOT EXISTS idx_general_expenses_sucursal ON general_expenses(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_general_expenses_fecha ON general_expenses(fecha);

-- RLS para small_expenses
ALTER TABLE small_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "small_expenses_select_admin_or_encargado"
  ON small_expenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND (
        u.role = 'admin'
        OR (u.role = 'encargado' AND u.sucursal_id = small_expenses.sucursal_id)
      )
    )
  );

CREATE POLICY "small_expenses_insert_admin_or_encargado"
  ON small_expenses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND (
        u.role = 'admin'
        OR (u.role = 'encargado' AND u.sucursal_id = small_expenses.sucursal_id)
      )
    )
  );

CREATE POLICY "small_expenses_update_admin_or_encargado"
  ON small_expenses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND (
        u.role = 'admin'
        OR (u.role = 'encargado' AND u.sucursal_id = small_expenses.sucursal_id)
      )
    )
  );

CREATE POLICY "small_expenses_delete_admin"
  ON small_expenses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- RLS para general_expenses
ALTER TABLE general_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "general_expenses_select_admin"
  ON general_expenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

CREATE POLICY "general_expenses_insert_admin"
  ON general_expenses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

CREATE POLICY "general_expenses_update_admin"
  ON general_expenses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

CREATE POLICY "general_expenses_delete_admin"
  ON general_expenses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );


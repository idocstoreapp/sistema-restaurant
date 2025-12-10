-- =====================================================
-- MIGRACIÓN 004: TABLAS DE ÓRDENES RESTAURANTE
-- =====================================================
-- Ejecutar en Supabase SQL Editor

-- Tabla de órdenes
CREATE TABLE IF NOT EXISTS ordenes_restaurante (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_orden TEXT NOT NULL UNIQUE,
  mesa_id UUID REFERENCES mesas(id) ON DELETE SET NULL,
  mesero_id UUID REFERENCES users(id) ON DELETE SET NULL,
  estado TEXT NOT NULL DEFAULT 'pending' CHECK (estado IN ('pending', 'preparing', 'ready', 'served', 'paid', 'cancelled')),
  total NUMERIC NOT NULL DEFAULT 0,
  propina_mesero NUMERIC DEFAULT 0,
  metodo_pago TEXT CHECK (metodo_pago IN ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA')),
  nota TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  payout_week INTEGER,
  payout_year INTEGER
);

-- Tabla pivote orden_items
CREATE TABLE IF NOT EXISTS orden_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id UUID REFERENCES ordenes_restaurante(id) ON DELETE CASCADE,
  menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio_unitario NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ordenes_mesa ON ordenes_restaurante(mesa_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_mesero ON ordenes_restaurante(mesero_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON ordenes_restaurante(estado);
CREATE INDEX IF NOT EXISTS idx_ordenes_fecha ON ordenes_restaurante(created_at);
CREATE INDEX IF NOT EXISTS idx_ordenes_paid ON ordenes_restaurante(paid_at);
CREATE INDEX IF NOT EXISTS idx_orden_items_orden ON orden_items(orden_id);
CREATE INDEX IF NOT EXISTS idx_orden_items_menu_item ON orden_items(menu_item_id);

-- Trigger para updated_at en órdenes
CREATE OR REPLACE FUNCTION update_ordenes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ordenes_updated_at ON ordenes_restaurante;

CREATE TRIGGER trigger_update_ordenes_updated_at
    BEFORE UPDATE ON ordenes_restaurante
    FOR EACH ROW
    EXECUTE FUNCTION update_ordenes_updated_at();

-- Trigger para actualizar total de orden
CREATE OR REPLACE FUNCTION actualizar_total_orden()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ordenes_restaurante
  SET total = (
    SELECT COALESCE(SUM(subtotal), 0)
    FROM orden_items
    WHERE orden_id = COALESCE(NEW.orden_id, OLD.orden_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.orden_id, OLD.orden_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_actualizar_total_orden ON orden_items;

CREATE TRIGGER trigger_actualizar_total_orden
  AFTER INSERT OR UPDATE OR DELETE ON orden_items
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_total_orden();

-- RLS
ALTER TABLE ordenes_restaurante ENABLE ROW LEVEL SECURITY;
ALTER TABLE orden_items ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas si existen
DROP POLICY IF EXISTS "ordenes_select_own_or_admin" ON ordenes_restaurante;
DROP POLICY IF EXISTS "ordenes_insert_mesero_or_admin" ON ordenes_restaurante;
DROP POLICY IF EXISTS "ordenes_update_own_or_admin" ON ordenes_restaurante;
DROP POLICY IF EXISTS "ordenes_delete_admin" ON ordenes_restaurante;
DROP POLICY IF EXISTS "orden_items_select_own_or_admin" ON orden_items;
DROP POLICY IF EXISTS "orden_items_insert_own_or_admin" ON orden_items;
DROP POLICY IF EXISTS "orden_items_update_own_or_admin" ON orden_items;
DROP POLICY IF EXISTS "orden_items_delete_own_or_admin" ON orden_items;

-- Políticas para órdenes
CREATE POLICY "ordenes_select_own_or_admin"
  ON ordenes_restaurante FOR SELECT
  USING (
    mesero_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'encargado')
    )
  );

CREATE POLICY "ordenes_insert_mesero_or_admin"
  ON ordenes_restaurante FOR INSERT
  WITH CHECK (
    mesero_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'encargado')
    )
  );

CREATE POLICY "ordenes_update_own_or_admin"
  ON ordenes_restaurante FOR UPDATE
  USING (
    mesero_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'encargado')
    )
  );

CREATE POLICY "ordenes_delete_admin"
  ON ordenes_restaurante FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- Políticas para orden_items
CREATE POLICY "orden_items_select_own_or_admin"
  ON orden_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ordenes_restaurante o
      WHERE o.id = orden_items.orden_id
      AND (
        o.mesero_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users u
          WHERE u.id = auth.uid()
          AND u.role IN ('admin', 'encargado')
        )
      )
    )
  );

CREATE POLICY "orden_items_insert_own_or_admin"
  ON orden_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ordenes_restaurante o
      WHERE o.id = orden_items.orden_id
      AND (
        o.mesero_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users u
          WHERE u.id = auth.uid()
          AND u.role IN ('admin', 'encargado')
        )
      )
    )
  );

CREATE POLICY "orden_items_update_own_or_admin"
  ON orden_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM ordenes_restaurante o
      WHERE o.id = orden_items.orden_id
      AND (
        o.mesero_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users u
          WHERE u.id = auth.uid()
          AND u.role IN ('admin', 'encargado')
        )
      )
    )
  );

CREATE POLICY "orden_items_delete_own_or_admin"
  ON orden_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM ordenes_restaurante o
      WHERE o.id = orden_items.orden_id
      AND (
        o.mesero_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users u
          WHERE u.id = auth.uid()
          AND u.role IN ('admin', 'encargado')
        )
      )
    )
  );

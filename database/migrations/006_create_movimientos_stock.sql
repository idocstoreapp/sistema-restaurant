-- =====================================================
-- MIGRACIÓN 006: TABLA DE MOVIMIENTOS DE STOCK
-- =====================================================
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS movimientos_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingrediente_id UUID REFERENCES ingredientes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste')),
  cantidad NUMERIC NOT NULL,
  motivo TEXT,
  referencia_id UUID, -- Puede ser compra_id, orden_id, etc.
  referencia_tipo TEXT, -- 'compra', 'orden', 'ajuste'
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_movimientos_ingrediente ON movimientos_stock(ingrediente_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos_stock(created_at);
CREATE INDEX IF NOT EXISTS idx_movimientos_tipo ON movimientos_stock(tipo);
CREATE INDEX IF NOT EXISTS idx_movimientos_referencia ON movimientos_stock(referencia_id, referencia_tipo);

-- Trigger para actualizar stock al crear compra
CREATE OR REPLACE FUNCTION actualizar_stock_compra()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ingredientes
  SET stock_actual = stock_actual + NEW.cantidad,
      updated_at = NOW()
  WHERE id = NEW.ingrediente_id;
  
  INSERT INTO movimientos_stock (ingrediente_id, tipo, cantidad, motivo, referencia_id, referencia_tipo, created_by)
  VALUES (NEW.ingrediente_id, 'entrada', NEW.cantidad, 'Compra a proveedor', NEW.compra_id, 'compra', auth.uid());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_actualizar_stock_compra ON compra_items;

CREATE TRIGGER trigger_actualizar_stock_compra
  AFTER INSERT ON compra_items
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_stock_compra();

-- Trigger para actualizar stock al crear orden
CREATE OR REPLACE FUNCTION actualizar_stock_orden()
RETURNS TRIGGER AS $$
DECLARE
  receta_ing RECORD;
  cantidad_necesaria NUMERIC;
BEGIN
  -- Obtener receta del menu_item
  FOR receta_ing IN 
    SELECT ri.ingrediente_id, ri.cantidad, ri.unidad_medida
    FROM receta_ingredientes ri
    JOIN recetas r ON r.id = ri.receta_id
    WHERE r.menu_item_id = NEW.menu_item_id
  LOOP
    -- Calcular cantidad necesaria (cantidad del item * cantidad en receta)
    cantidad_necesaria := NEW.cantidad * receta_ing.cantidad;
    
    -- Actualizar stock
    UPDATE ingredientes
    SET stock_actual = stock_actual - cantidad_necesaria,
        updated_at = NOW()
    WHERE id = receta_ing.ingrediente_id;
    
    -- Registrar movimiento
    INSERT INTO movimientos_stock (ingrediente_id, tipo, cantidad, motivo, referencia_id, referencia_tipo, created_by)
    VALUES (receta_ing.ingrediente_id, 'salida', cantidad_necesaria, 'Orden restaurante', NEW.orden_id, 'orden', auth.uid());
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_actualizar_stock_orden ON orden_items;

CREATE TRIGGER trigger_actualizar_stock_orden
  AFTER INSERT ON orden_items
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_stock_orden();

-- RLS
ALTER TABLE movimientos_stock ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "movimientos_stock_select_admin" ON movimientos_stock;
DROP POLICY IF EXISTS "movimientos_stock_insert_admin" ON movimientos_stock;

CREATE POLICY "movimientos_stock_select_admin"
  ON movimientos_stock FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'encargado')
    )
  );

CREATE POLICY "movimientos_stock_insert_admin"
  ON movimientos_stock FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'encargado')
    )
  );


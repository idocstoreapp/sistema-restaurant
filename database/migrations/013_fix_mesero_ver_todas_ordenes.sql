-- =====================================================
-- MIGRACIÓN 013: PERMITIR A MESEROS VER TODAS LAS ÓRDENES ACTIVAS
-- =====================================================
-- Ejecutar en Supabase SQL Editor
-- Soluciona el problema de sincronización: meseros deben ver todas las órdenes activas
-- para que el estado de las mesas se sincronice correctamente entre admin y mesero

-- Eliminar política existente
DROP POLICY IF EXISTS "ordenes_select_own_or_admin" ON ordenes_restaurante;

-- Nueva política: Meseros pueden VER todas las órdenes activas (para sincronización de mesas)
-- pero solo pueden MODIFICAR sus propias órdenes
CREATE POLICY "ordenes_select_own_or_admin"
  ON ordenes_restaurante FOR SELECT
  USING (
    -- Admin y encargado ven todo
    is_admin_or_encargado()
    OR
    -- Meseros ven todas las órdenes activas (pending, preparing, ready, served)
    -- Esto permite que vean el estado correcto de las mesas
    (
      EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role = 'mesero'
      )
      AND estado IN ('pending', 'preparing', 'ready', 'served')
    )
    OR
    -- También pueden ver sus propias órdenes (incluyendo pagadas)
    mesero_id = auth.uid()
  );

-- También actualizar política de orden_items para que meseros vean items de órdenes activas
DROP POLICY IF EXISTS "orden_items_select_own_or_admin" ON orden_items;

CREATE POLICY "orden_items_select_own_or_admin"
  ON orden_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ordenes_restaurante o
      WHERE o.id = orden_items.orden_id
      AND (
        -- Admin y encargado ven todo
        is_admin_or_encargado()
        OR
        -- Meseros ven items de órdenes activas
        (
          EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'mesero'
          )
          AND o.estado IN ('pending', 'preparing', 'ready', 'served')
        )
        OR
        -- También pueden ver items de sus propias órdenes
        o.mesero_id = auth.uid()
      )
    )
  );

-- Verificar que las políticas estén activas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('ordenes_restaurante', 'orden_items')
AND policyname LIKE '%select%'
ORDER BY tablename, policyname;


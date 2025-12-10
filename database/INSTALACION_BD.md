# 📋 GUÍA DE INSTALACIÓN DE BASE DE DATOS

## 🎯 Instrucciones para crear las tablas en Supabase

Sigue estos pasos en orden para crear todas las tablas necesarias en tu base de datos de Supabase del menú QR.

---

## 📝 PASO 1: Preparar Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Abre el **SQL Editor**
3. Asegúrate de estar en la base de datos correcta (la del menú QR)

---

## 📝 PASO 2: Ejecutar Migraciones en Orden

Ejecuta cada archivo SQL en el orden indicado. **IMPORTANTE:** Ejecuta uno a la vez y verifica que no haya errores antes de continuar.

### 2.1 Migración 000: Tablas Base (EJECUTAR PRIMERO)
```sql
-- Copia y pega el contenido de: database/migrations/000_create_tablas_base.sql
```
**Esta migración crea: suppliers, users, branches (necesarias para las demás)**

### 2.2 Migración 001: Ingredientes
```sql
-- Copia y pega el contenido de: database/migrations/001_create_ingredientes.sql
```
**Verificación:**
```sql
SELECT * FROM ingredientes LIMIT 1;
```

### 2.3 Migración 002: Recetas
```sql
-- Copia y pega el contenido de: database/migrations/002_create_recetas.sql
```
**Verificación:**
```sql
SELECT * FROM recetas LIMIT 1;
SELECT * FROM receta_ingredientes LIMIT 1;
```

### 2.4 Migración 003: Mesas
```sql
-- Copia y pega el contenido de: database/migrations/003_create_mesas.sql
```
**Verificación:**
```sql
SELECT * FROM mesas LIMIT 1;
```

### 2.5 Migración 004: Órdenes
```sql
-- Copia y pega el contenido de: database/migrations/004_create_ordenes.sql
```
**Verificación:**
```sql
SELECT * FROM ordenes_restaurante LIMIT 1;
SELECT * FROM orden_items LIMIT 1;
```

### 2.6 Migración 005: Compras
```sql
-- Copia y pega el contenido de: database/migrations/005_create_compras.sql
```
**Verificación:**
```sql
SELECT * FROM compras LIMIT 1;
SELECT * FROM compra_items LIMIT 1;
```

### 2.7 Migración 006: Movimientos de Stock
```sql
-- Copia y pega el contenido de: database/migrations/006_create_movimientos_stock.sql
```
**Verificación:**
```sql
SELECT * FROM movimientos_stock LIMIT 1;
```

### 2.8 Migración 007: Tablas de Gastos
```sql
-- Copia y pega el contenido de: database/migrations/007_create_tablas_sistema_reparaciones.sql
```
**Verificación:**
```sql
SELECT * FROM small_expenses LIMIT 1;
SELECT * FROM general_expenses LIMIT 1;
```

**Nota:** `users`, `suppliers` y `branches` ya fueron creados en la migración 000.

---

## 📝 PASO 3: Crear Datos Iniciales (Opcional)

### 3.1 Crear Sucursal por Defecto
```sql
INSERT INTO branches (name, address) 
VALUES ('Sucursal Principal', 'Dirección principal')
ON CONFLICT (name) DO NOTHING;
```

### 3.2 Crear Mesas de Ejemplo

**Opción A: Usando generate_series (más compacto)**
```sql
INSERT INTO mesas (numero, capacidad, estado, ubicacion)
SELECT 
  generate_series(1, 10) as numero,
  4 as capacidad,
  'libre' as estado,
  'Sala principal' as ubicacion
ON CONFLICT (numero) DO NOTHING;
```

**Opción B: Una por una (más seguro si la anterior falla)**
```sql
INSERT INTO mesas (numero, capacidad, estado, ubicacion) VALUES
  (1, 4, 'libre', 'Sala principal'),
  (2, 4, 'libre', 'Sala principal'),
  (3, 4, 'libre', 'Sala principal'),
  (4, 4, 'libre', 'Sala principal'),
  (5, 4, 'libre', 'Sala principal'),
  (6, 4, 'libre', 'Sala principal'),
  (7, 4, 'libre', 'Sala principal'),
  (8, 4, 'libre', 'Sala principal'),
  (9, 4, 'libre', 'Sala principal'),
  (10, 4, 'libre', 'Sala principal')
ON CONFLICT (numero) DO NOTHING;
```

### 3.3 Crear Proveedor de Ejemplo
```sql
INSERT INTO suppliers (name, contact_info)
VALUES ('Proveedor General', 'contacto@proveedor.com')
ON CONFLICT DO NOTHING;
```

---

## 📝 PASO 4: Verificar Instalación Completa

Ejecuta este script para verificar que todas las tablas fueron creadas correctamente:

```sql
-- Verificar todas las tablas nuevas
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN (
    'ingredientes',
    'recetas',
    'receta_ingredientes',
    'mesas',
    'ordenes_restaurante',
    'orden_items',
    'compras',
    'compra_items',
    'movimientos_stock',
    'users',
    'suppliers',
    'branches',
    'small_expenses',
    'general_expenses'
  )
ORDER BY table_name;
```

Deberías ver 14 tablas listadas.

---

## 📝 PASO 5: Verificar RLS (Row Level Security)

Verifica que RLS esté habilitado en todas las tablas:

```sql
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'ingredientes',
    'recetas',
    'receta_ingredientes',
    'mesas',
    'ordenes_restaurante',
    'orden_items',
    'compras',
    'compra_items',
    'movimientos_stock',
    'users',
    'suppliers',
    'branches',
    'small_expenses',
    'general_expenses'
  )
ORDER BY tablename;
```

Todas deberían tener `rls_enabled = true`.

---

## 📝 PASO 6: Migrar Usuarios Admin (Opcional)

Si tienes usuarios en `admin_users` y quieres migrarlos a Supabase Auth:

1. **Crear usuario en Supabase Auth:**
   - Ve a Authentication > Users
   - Crea usuario manualmente o usa la API

2. **Insertar en tabla users:**
```sql
INSERT INTO users (id, role, name, email)
VALUES (
  'UUID_DEL_USUARIO_EN_AUTH',  -- Reemplazar con UUID real
  'admin',
  'Nombre Admin',
  'admin@example.com'
);
```

---

## ✅ Verificación Final

Ejecuta este script completo para verificar que todo está correcto:

```sql
-- Verificar estructura completa
DO $$
DECLARE
  table_count INTEGER;
  rls_count INTEGER;
BEGIN
  -- Contar tablas
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN (
      'ingredientes', 'recetas', 'receta_ingredientes',
      'mesas', 'ordenes_restaurante', 'orden_items',
      'compras', 'compra_items', 'movimientos_stock',
      'users', 'suppliers', 'branches',
      'small_expenses', 'general_expenses'
    );
  
  -- Contar tablas con RLS
  SELECT COUNT(*) INTO rls_count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND rowsecurity = true
    AND tablename IN (
      'ingredientes', 'recetas', 'receta_ingredientes',
      'mesas', 'ordenes_restaurante', 'orden_items',
      'compras', 'compra_items', 'movimientos_stock',
      'users', 'suppliers', 'branches',
      'small_expenses', 'general_expenses'
    );
  
  RAISE NOTICE 'Tablas creadas: %', table_count;
  RAISE NOTICE 'Tablas con RLS: %', rls_count;
  
  IF table_count = 14 AND rls_count = 14 THEN
    RAISE NOTICE '✅ Instalación completada correctamente!';
  ELSE
    RAISE WARNING '⚠️ Algunas tablas faltan o RLS no está habilitado';
  END IF;
END $$;
```

---

## 🚨 Solución de Problemas

### Error: "relation already exists"
- Algunas tablas ya existen. Esto es normal si ejecutaste migraciones antes.
- Puedes usar `CREATE TABLE IF NOT EXISTS` (ya está en los scripts)

### Error: "permission denied"
- Verifica que tengas permisos de administrador en Supabase
- Algunos triggers pueden requerir permisos adicionales

### Error: "foreign key constraint"
- Asegúrate de ejecutar las migraciones en orden
- Verifica que las tablas referenciadas existan

### RLS bloqueando consultas
- Si estás probando desde el SQL Editor, usa el Service Role Key
- O crea un usuario de prueba en Supabase Auth

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs de Supabase
2. Verifica que todas las migraciones se ejecutaron en orden
3. Asegúrate de tener permisos de administrador

---

**¡Listo!** Una vez completados estos pasos, tu base de datos estará lista para usar el sistema completo.


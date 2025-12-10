# 📋 INSTRUCCIONES PARA CREAR LAS TABLAS EN SUPABASE

## 🎯 Pasos para Configurar la Base de Datos

Sigue estos pasos **en orden** para crear todas las tablas necesarias en tu base de datos de Supabase del menú QR.

---

## 📝 PASO 1: Acceder a Supabase

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto (el del menú QR)
3. Abre el **SQL Editor** (menú lateral izquierdo)

---

## 📝 PASO 2: Ejecutar Migraciones en Orden

**IMPORTANTE:** Ejecuta cada migración **una por una** y verifica que no haya errores antes de continuar.

**⚠️ NUEVO:** Ahora hay una migración **000** que debe ejecutarse PRIMERO (crea suppliers, users y branches).

### Migración 000: Tablas Base (IMPORTANTE: Ejecutar primero)

1. Abre el archivo: `app-final/database/migrations/000_create_tablas_base.sql`
2. Copia **todo el contenido** del archivo
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en **RUN** (o presiona Ctrl+Enter)
5. Verifica que no haya errores

**Verificación rápida:**
```sql
SELECT * FROM suppliers LIMIT 1;
SELECT * FROM users LIMIT 1;
SELECT * FROM branches LIMIT 1;
```

### Migración 001: Ingredientes

1. Abre el archivo: `app-final/database/migrations/001_create_ingredientes.sql`
2. Copia **todo el contenido** del archivo
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en **RUN** (o presiona Ctrl+Enter)
5. Verifica que no haya errores

**Verificación rápida:**
```sql
SELECT * FROM ingredientes LIMIT 1;
```

### Migración 002: Recetas

1. Abre: `app-final/database/migrations/002_create_recetas.sql`
2. Copia y pega en SQL Editor
3. Ejecuta
4. Verifica

**Verificación:**
```sql
SELECT * FROM recetas LIMIT 1;
SELECT * FROM receta_ingredientes LIMIT 1;
```

### Migración 003: Mesas

1. Abre: `app-final/database/migrations/003_create_mesas.sql`
2. Copia y pega en SQL Editor
3. Ejecuta
4. Verifica

**Verificación:**
```sql
SELECT * FROM mesas LIMIT 1;
```

### Migración 004: Órdenes

1. Abre: `app-final/database/migrations/004_create_ordenes.sql`
2. Copia y pega en SQL Editor
3. Ejecuta
4. Verifica

**Verificación:**
```sql
SELECT * FROM ordenes_restaurante LIMIT 1;
SELECT * FROM orden_items LIMIT 1;
```

### Migración 005: Compras

1. Abre: `app-final/database/migrations/005_create_compras.sql`
2. Copia y pega en SQL Editor
3. Ejecuta
4. Verifica

**Verificación:**
```sql
SELECT * FROM compras LIMIT 1;
SELECT * FROM compra_items LIMIT 1;
```

### Migración 006: Movimientos de Stock

1. Abre: `app-final/database/migrations/006_create_movimientos_stock.sql`
2. Copia y pega en SQL Editor
3. Ejecuta
4. Verifica

**Verificación:**
```sql
SELECT * FROM movimientos_stock LIMIT 1;
```

### Migración 007: Tablas de Gastos

1. Abre: `app-final/database/migrations/007_create_tablas_sistema_reparaciones.sql`
2. Copia y pega en SQL Editor
3. Ejecuta
4. Verifica

**Verificación:**
```sql
SELECT * FROM small_expenses LIMIT 1;
SELECT * FROM general_expenses LIMIT 1;
```

**Nota:** `users`, `suppliers` y `branches` ya fueron creados en la migración 000.

---

## 📝 PASO 3: Crear Datos Iniciales (Opcional pero Recomendado)

### 3.1 Crear Sucursal Principal

Ejecuta en SQL Editor:

```sql
INSERT INTO branches (name, address) 
VALUES ('Sucursal Principal', 'Dirección principal')
ON CONFLICT (name) DO NOTHING;
```

### 3.2 Crear Mesas de Ejemplo

Ejecuta para crear 10 mesas:

```sql
-- Crear 10 mesas numeradas del 1 al 10
INSERT INTO mesas (numero, capacidad, estado, ubicacion)
SELECT 
  generate_series(1, 10) as numero,
  4 as capacidad,
  'libre' as estado,
  'Sala principal' as ubicacion
ON CONFLICT (numero) DO NOTHING;
```

**Si el script anterior da error, usa esta versión alternativa (más simple):**

```sql
-- Crear mesas una por una (más seguro)
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

## 📝 PASO 4: Crear Usuario Admin

### Opción A: Desde Supabase Dashboard (Recomendado)

1. Ve a **Authentication** > **Users** en Supabase
2. Haz clic en **Add User** > **Create new user**
3. Ingresa:
   - Email: `admin@restaurante.com` (o el que prefieras)
   - Password: (elige una contraseña segura)
4. Haz clic en **Create User**
5. **Copia el UUID** del usuario creado (aparece en la lista)

### Opción B: Desde SQL (si ya tienes usuario en auth.users)

Si ya tienes un usuario en `auth.users`, solo necesitas insertarlo en la tabla `users`:

```sql
-- Reemplaza 'UUID_DEL_USUARIO' con el UUID real de auth.users
INSERT INTO users (id, role, name, email)
VALUES (
  'UUID_DEL_USUARIO',  -- ⚠️ REEMPLAZAR CON UUID REAL
  'admin',
  'Administrador',
  'admin@restaurante.com'  -- ⚠️ REEMPLAZAR CON EMAIL REAL
);
```

**Para obtener el UUID de un usuario existente:**
```sql
SELECT id, email FROM auth.users;
```

---

## 📝 PASO 5: Verificar Instalación Completa

Ejecuta este script para verificar que todo está correcto:

```sql
-- Verificar todas las tablas
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

**Deberías ver 14 tablas listadas.**

---

## 📝 PASO 6: Verificar RLS (Row Level Security)

Verifica que RLS esté habilitado:

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

**Todas deberían tener `rls_enabled = true`.**

---

## ✅ Verificación Final

Ejecuta este script completo:

```sql
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
  
  RAISE NOTICE '✅ Tablas creadas: %', table_count;
  RAISE NOTICE '✅ Tablas con RLS: %', rls_count;
  
  IF table_count = 14 AND rls_count = 14 THEN
    RAISE NOTICE '🎉 ¡Instalación completada correctamente!';
  ELSE
    RAISE WARNING '⚠️ Algunas tablas faltan o RLS no está habilitado';
  END IF;
END $$;
```

Si ves el mensaje "¡Instalación completada correctamente!", **¡estás listo!** 🎉

---

## 🚨 Solución de Problemas

### Error: "relation already exists"
- Algunas tablas ya existen. Esto es normal si ejecutaste migraciones antes.
- Los scripts usan `CREATE TABLE IF NOT EXISTS`, así que no debería dar error.

### Error: "permission denied"
- Verifica que tengas permisos de administrador en Supabase
- Algunos triggers pueden requerir permisos adicionales

### Error: "foreign key constraint"
- Asegúrate de ejecutar las migraciones en orden
- Verifica que las tablas referenciadas existan

### RLS bloqueando consultas
- Si estás probando desde el SQL Editor, usa el Service Role Key
- O crea un usuario de prueba en Supabase Auth

### No puedo iniciar sesión
- Verifica que el usuario exista en `auth.users`
- Verifica que exista un registro en la tabla `users` con el mismo UUID
- Verifica que el rol sea 'admin', 'mesero' o 'encargado'

---

## 📞 Siguiente Paso

Una vez completada la instalación de la base de datos:

1. Configura las variables de entorno en `.env`
2. Ejecuta `npm install` en `app-final`
3. Ejecuta `npm run dev`
4. Ve a `http://localhost:4321/admin/login`
5. Inicia sesión con el usuario admin que creaste

---

**¡Listo!** Tu base de datos está configurada y lista para usar. 🚀


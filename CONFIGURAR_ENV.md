# Configuración de Variables de Entorno

## 📋 Pasos para Configurar

### 1. Obtener Credenciales de Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a **Settings** → **API**
3. Encuentra:
   - **Project URL**: Copia la URL (ejemplo: `https://xxxxx.supabase.co`)
   - **Project API keys**: 
     - Copia la clave `anon public` (para el cliente)
     - Copia la clave `service_role` (para crear usuarios desde el servidor)

### 2. Configurar el archivo .env

1. Abre el archivo `.env` en la raíz del proyecto
2. Reemplaza los valores:

```env
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui

# Configuración de Impresoras Térmicas (Opcional)
# Si no se configuran, el sistema funcionará normalmente pero sin impresión automática

# Impresora de Cocina (para comandas)
PRINTER_KITCHEN_TYPE=network
PRINTER_KITCHEN_IP=192.168.1.100
PRINTER_KITCHEN_PORT=9100

# Impresora de Caja (para boletas)
PRINTER_CASHIER_TYPE=network
PRINTER_CASHIER_IP=192.168.1.101
PRINTER_CASHIER_PORT=9100

# Para impresoras USB, usar:
# PRINTER_KITCHEN_TYPE=usb
# PRINTER_KITCHEN_PATH=/dev/usb/lp0  # Linux
# PRINTER_KITCHEN_PATH=COM3          # Windows (puerto COM)
# PRINTER_KITCHEN_PATH=USB002        # Windows (puerto USB virtual - RECOMENDADO)
# PRINTER_KITCHEN_PATH=LPT1          # Windows (puerto paralelo, no recomendado)

# 📖 Ver GUIA_CONFIGURAR_IMPRESORAS.md para saber cómo encontrar estos valores
# ⚠️ Si tu impresora USB aparece como LPT1, ver SOLUCION_LPT1_USB.md
```

**Ejemplo real:**
```env
PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI5MCwiZXhwIjoxOTU0NTQzMjkwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Reiniciar el Servidor

Después de configurar el `.env`:

1. Detén el servidor (Ctrl + C)
2. Reinicia con `npm run dev`

### 4. Verificar que Funciona

1. Abre el navegador en `http://localhost:4321`
2. Si ves el sitio funcionando, la configuración es correcta
3. Si ves errores en la consola del navegador sobre Supabase, verifica:
   - Que las URLs y claves estén correctas
   - Que no haya espacios extra en el archivo `.env`
   - Que el archivo se llame exactamente `.env` (no `.env.txt`)

## ⚠️ Importante

- **NUNCA** subas el archivo `.env` a Git
- El archivo `.env` ya está en `.gitignore`
- El archivo `.env.example` es solo una plantilla y SÍ se sube a Git

## 🔒 Seguridad

- La clave `anon public` es segura para usar en el cliente
- No expongas la clave `service_role` (solo para servidor)
- Las variables con `PUBLIC_` son accesibles desde el navegador

## 📝 Estructura del archivo .env

```env
# URL del proyecto Supabase
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co

# Clave anónima pública (para cliente)
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Clave de servicio (SOLO para servidor - crear usuarios)
# IMPORTANTE: Esta clave NO debe exponerse en el cliente
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🆘 Solución de Problemas

### Error: "Variables de entorno de Supabase no configuradas"

- Verifica que el archivo `.env` existe en la raíz del proyecto
- Verifica que las variables empiecen con `PUBLIC_`
- Reinicia el servidor después de modificar `.env`

### Error: "Invalid API key"

- Verifica que copiaste la clave completa (son muy largas)
- Verifica que no hay espacios al inicio o final
- Asegúrate de usar la clave `anon public`, no `service_role`

### El servidor no detecta los cambios en .env

- Detén completamente el servidor (Ctrl + C)
- Inicia nuevamente con `npm run dev`
- Astro carga las variables de entorno al iniciar


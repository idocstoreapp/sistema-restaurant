# 🖨️ Servicio Local de Impresión

Este servicio corre en una PC local del restaurante y se encarga únicamente de imprimir.

**Ventaja:** Si este servicio se apaga, la página web sigue funcionando (solo no imprime).

---

## 📋 Instalación

### 1. Instalar Node.js

Descarga desde: https://nodejs.org (versión LTS)

### 2. Instalar Dependencias

```bash
cd servicio-impresion-local
npm install
```

### 3. Configurar .env

Copia `.env.example` a `.env` y edita:

```env
PRINT_SERVICE_PORT=3001
PRINT_SERVICE_TOKEN=tu-token-seguro-aqui

PRINTER_KITCHEN_TYPE=usb
PRINTER_KITCHEN_PATH=USB002

PRINTER_CASHIER_TYPE=usb
PRINTER_CASHIER_PATH=USB002
```

### 4. Iniciar el Servicio

```bash
npm start
```

Deberías ver:
```
🖨️  Servicio de Impresión Local iniciado
📡 Escuchando en puerto 3001
✅ Servicio de impresión escuchando en http://localhost:3001
```

---

## 🔄 Hacer que Inicie Automáticamente

### ⭐ Método Automático (RECOMENDADO - Más Fácil)

**Solo ejecuta el script de instalación:**

1. Doble clic en `instalar-automatico.bat`
2. El script configura todo automáticamente
3. El servicio iniciará cada vez que enciendas la PC

**Ver `INICIO_RAPIDO.md` para instrucciones completas.**

---

### Método Manual

**Opción A: Task Scheduler**

1. Presiona `Win + R` → `taskschd.msc`
2. Crear tarea básica
3. Nombre: "Servicio Impresión Restaurante"
4. Disparador: "Al iniciar sesión"
5. Acción: "Iniciar un programa"
6. Programa: `C:\Program Files\nodejs\node.exe`
7. Argumentos: `C:\ruta\al\servicio-impresion-local\server.js`
8. Directorio: `C:\ruta\al\servicio-impresion-local`

**Opción B: PM2**

En PowerShell o CMD (NO escribas "bash", solo los comandos):

```
npm install -g pm2
pm2 start server.js --name "impresion"
pm2 save
pm2 startup
```

**Nota:** En Windows, escribe los comandos directamente en PowerShell o CMD, sin escribir "bash".

---

## 🔍 Encontrar la IP Local

```powershell
ipconfig
```

Busca `IPv4 Address` (ejemplo: `192.168.1.50`)

**Esta IP la necesitarás para configurar en el servidor principal.**

---

## ✅ Verificación

El servicio está funcionando si:
- ✅ Muestra "Servicio de impresión escuchando"
- ✅ No hay errores en la consola
- ✅ Puedes acceder a `http://localhost:3001` (debe dar error 405, pero significa que está activo)

---

## 🆘 Problemas

### "Error conectando a impresora"

- Verifica que la impresora esté conectada
- Verifica el PATH en `.env` (USB002, COM3, etc.)
- Prueba imprimir desde Windows primero

### "Puerto ya en uso"

- Cambia `PRINT_SERVICE_PORT` en `.env` a otro puerto (ej: 3002)

### "No imprime"

- Revisa los logs del servicio
- Verifica que el token coincida con el del servidor principal

---

**¡Listo! Este servicio solo se encarga de imprimir. La página web funciona independientemente.** ✅


@echo off
setlocal enabledelayedexpansion
echo ============================================
echo  ENCONTRAR PUERTO CORRECTO DE IMPRESORA
echo ============================================
echo.

echo [1] Listando impresoras instaladas en Windows...
echo.
powershell -Command "Get-Printer | Select-Object Name, PrinterStatus, PortName, DriverName | Format-Table -AutoSize"
echo.

echo [2] Listando puertos COM disponibles...
echo.
powershell -Command "Get-WmiObject Win32_SerialPort | Select-Object DeviceID, Description, Status | Format-Table -AutoSize"
echo.

echo [3] Creando script de prueba para encontrar el puerto correcto...
echo.

REM Obtener nombre de impresora
echo Ingresa el nombre EXACTO de tu impresora (o presiona Enter para usar la primera):
set /p printer_name=

if "!printer_name!"=="" (
    echo Obteniendo primera impresora...
    for /f "tokens=1" %%a in ('powershell -Command "Get-Printer | Select-Object -First 1 -ExpandProperty Name"') do set "printer_name=%%a"
    echo Usando: !printer_name!
)

echo.
echo [4] Obteniendo puerto de la impresora...
for /f "tokens=1" %%a in ('powershell -Command "Get-Printer -Name '!printer_name!' | Select-Object -ExpandProperty PortName"') do set "printer_port=%%a"

echo.
echo ============================================
echo  RESULTADO
echo ============================================
echo.
echo Nombre de impresora: !printer_name!
echo Puerto configurado: !printer_port!
echo.

REM Crear script de prueba
echo [5] Creando script de prueba de conexion...
(
echo const escpos = require^('escpos'^);
echo let USB, Printer;
echo.
echo // Intentar diferentes formas de importacion
echo if ^(escpos.USB^) {
echo   USB = escpos.USB;
echo   Printer = escpos.Printer;
echo } else if ^(escpos.default && escpos.default.USB^) {
echo   USB = escpos.default.USB;
echo   Printer = escpos.default.Printer;
echo } else {
echo   ^({ USB, Printer } = escpos^);
echo }
echo.
echo if ^(!USB || typeof USB !== 'function'^) {
echo   console.error^('ERROR: USB no esta disponible'^);
echo   console.error^('Verifica que escpos este instalado: npm install escpos'^);
echo   process.exit^(1^);
echo }
echo.
echo console.log^('========================================'^);
echo console.log^('  PRUEBA DE CONEXION USB'^);
echo console.log^('========================================'^);
echo console.log^(''^);
echo.
echo const pathsToTry = [];
echo.
echo // Agregar el puerto encontrado
echo if ^('!printer_port!'^) {
echo   pathsToTry.push^('!printer_port!'^);
echo   console.log^('Puerto encontrado: !printer_port!'^);
echo }
echo.
echo // Agregar variaciones comunes
echo if ^('!printer_port!'^) {
echo   if ^('!printer_port!'^.toUpperCase^(^).startsWith^('USB'^)^) {
echo     const numericPart = '!printer_port!'.replace^(/^USB/i, ''^);
echo     pathsToTry.push^(numericPart^);
echo     console.log^('Tambien probando sin prefijo USB: ' + numericPart^);
echo   }
echo }
echo.
echo // Intentar COM3, COM4, COM5, COM6
echo for ^(let i = 3; i ^<= 6; i++^) {
echo   pathsToTry.push^('COM' + i^);
echo }
echo.
echo console.log^(''^);
echo console.log^('Intentando conectar con los siguientes paths:'^);
echo pathsToTry.forEach^((p, i^) =^> console.log^(`  ${i+1}. ${p}`^)^);
echo console.log^(''^);
echo.
echo let connected = false;
echo.
echo for ^(const path of pathsToTry^) {
echo   try {
echo     console.log^(`Intentando con: ${path}...`^);
echo     const device = new USB^(path^);
echo     console.log^(`✅ Dispositivo USB creado exitosamente con: ${path}`^);
echo     const printer = new Printer^(device^);
echo     console.log^(`✅ Printer creado exitosamente`^);
echo     console.log^(`🎉 SUCCESS: El puerto correcto es: ${path}`^);
echo     console.log^(`📝 Actualiza tu .env con: PRINTER_KITCHEN_PATH=${path}`^);
echo     connected = true;
echo     break;
echo   } catch ^(error^) {
echo     console.log^(`❌ ${path} fallo: ${error.message}`^);
echo   }
echo }
echo.
echo if ^(!connected^) {
echo   console.error^('❌ No se pudo conectar con ningun puerto'^);
echo   console.error^('Verifica que:'^);
echo   console.error^('  1. La impresora este encendida y conectada'^);
echo   console.error^('  2. El driver este instalado correctamente'^);
echo   console.error^('  3. La impresora no este siendo usada por otro programa'^);
echo   process.exit^(1^);
echo }
) > test-puerto.js

echo Script creado: test-puerto.js
echo.
echo [6] Ejecutando prueba...
echo.
node test-puerto.js

echo.
echo ============================================
echo  FIN DE PRUEBA
echo ============================================
echo.
del test-puerto.js
pause


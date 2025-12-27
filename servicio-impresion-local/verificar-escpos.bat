@echo off
echo ============================================
echo  VERIFICAR INSTALACION DE escpos
echo ============================================
echo.

echo [1] Verificando si escpos esta instalado...
echo.
if not exist node_modules\escpos (
    echo ERROR: escpos NO esta instalado
    echo.
    echo Instalando escpos...
    call npm install escpos
    echo.
) else (
    echo OK: escpos esta instalado
    echo.
)

echo [2] Verificando la estructura de escpos...
echo.
echo Creando script de prueba...
(
echo const escpos = require^('escpos'^);
echo console.log^('========================================'^);
echo console.log^('  VERIFICACION DE escpos'^);
echo console.log^('========================================'^);
echo console.log^(''^);
echo.
echo console.log^('Tipo de escpos:', typeof escpos^);
echo console.log^('Keys de escpos:', Object.keys^(escpos^).join^(', '^)^);
echo console.log^(''^);
echo.
echo // Verificar USB
echo if ^(escpos.USB^) {
echo   console.log^('✅ USB encontrado en escpos.USB'^);
echo   console.log^('   Tipo:', typeof escpos.USB^);
echo } else if ^(escpos.default && escpos.default.USB^) {
echo   console.log^('✅ USB encontrado en escpos.default.USB'^);
echo   console.log^('   Tipo:', typeof escpos.default.USB^);
echo } else {
echo   console.error^('❌ USB NO encontrado'^);
echo }
echo.
echo // Verificar Printer
echo if ^(escpos.Printer^) {
echo   console.log^('✅ Printer encontrado en escpos.Printer'^);
echo   console.log^('   Tipo:', typeof escpos.Printer^);
echo } else if ^(escpos.default && escpos.default.Printer^) {
echo   console.log^('✅ Printer encontrado en escpos.default.Printer'^);
echo   console.log^('   Tipo:', typeof escpos.default.Printer^);
echo } else {
echo   console.error^('❌ Printer NO encontrado'^);
echo }
echo.
echo // Verificar Network
echo if ^(escpos.Network^) {
echo   console.log^('✅ Network encontrado en escpos.Network'^);
echo   console.log^('   Tipo:', typeof escpos.Network^);
echo } else if ^(escpos.default && escpos.default.Network^) {
echo   console.log^('✅ Network encontrado en escpos.default.Network'^);
echo   console.log^('   Tipo:', typeof escpos.default.Network^);
echo } else {
echo   console.error^('❌ Network NO encontrado'^);
echo }
echo.
echo console.log^(''^);
echo console.log^('========================================'^);
) > test-escpos.js

echo Ejecutando verificacion...
echo.
node test-escpos.js

echo.
echo ============================================
echo  RESULTADO
echo ============================================
echo.
echo Si ves errores, puede ser necesario:
echo 1. Reinstalar escpos: npm uninstall escpos ^&^& npm install escpos
echo 2. Verificar la version en package.json
echo.
del test-escpos.js
pause


@echo off
setlocal enabledelayedexpansion
REM ============================================
REM Script de Instalacion Automatica
REM Servicio de Impresion Local
REM ============================================
REM Este script configura todo para que el servicio
REM inicie automaticamente al encender la PC
REM ============================================

echo.
echo ============================================
echo  INSTALACION AUTOMATICA
echo  Servicio de Impresion Local
echo ============================================
echo.

REM Verificar que Node.js este instalado
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js no esta instalado
    echo.
    echo Por favor instala Node.js desde: https://nodejs.org
    echo Luego ejecuta este script de nuevo
    pause
    exit /b 1
)

echo [1/5] Node.js encontrado: 
node --version
echo.

REM Instalar dependencias
echo [2/5] Instalando dependencias...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: No se pudieron instalar las dependencias
    pause
    exit /b 1
)
echo.

REM Verificar que existe .env
if not exist .env (
    echo [3/5] Creando archivo .env...
    copy .env.example .env >nul
    
    REM Generar token automatico
    for /f "tokens=2 delims==" %%a in ('wmic os get localdatetime /value') do set datetime=%%a
    set token=restaurante-!datetime:~0,8!-!RANDOM!
    
    REM Reemplazar token en .env
    powershell -Command "(Get-Content .env) -replace 'cambiar-este-token-por-uno-seguro', '!token!' | Set-Content .env"
    
    echo.
    echo Archivo .env creado con token automatico.
    echo.
    echo IMPORTANTE: Configura el puerto de tu impresora:
    echo   1. Se abrira el archivo .env automaticamente
    echo   2. Busca la linea: PRINTER_KITCHEN_PATH=USB002
    echo   3. Cambia USB002 por el puerto de tu impresora
    echo   4. Guarda el archivo (Ctrl+S) y cierra
    echo.
    timeout /t 5 /nobreak >nul
    notepad .env
    echo.
    echo Presiona cualquier tecla cuando hayas guardado el archivo .env...
    pause >nul
) else (
    echo [3/5] Archivo .env ya existe
)
echo.

REM Instalar PM2 globalmente
echo [4/5] Instalando PM2 (gestor de procesos)...
call npm install -g pm2
if %ERRORLEVEL% NEQ 0 (
    echo ADVERTENCIA: No se pudo instalar PM2 globalmente
    echo El servicio funcionara, pero no iniciara automaticamente
    echo.
) else (
    echo PM2 instalado correctamente
)
echo.

REM Configurar PM2 para iniciar automaticamente
echo [5/5] Configurando inicio automatico...
if exist "%APPDATA%\npm\pm2.cmd" (
    call pm2 start server.js --name "impresion-restaurante"
    call pm2 save
    call pm2 startup
    echo.
    echo ============================================
    echo  INSTALACION COMPLETADA
    echo ============================================
    echo.
    echo El servicio esta corriendo y se iniciara automaticamente
    echo al encender la PC.
    echo.
    echo Para ver el estado: pm2 status
    echo Para detener: pm2 stop impresion-restaurante
    echo Para iniciar: pm2 start impresion-restaurante
    echo Para ver logs: pm2 logs impresion-restaurante
    echo.
) else (
    echo.
    echo ============================================
    echo  INSTALACION PARCIAL
    echo ============================================
    echo.
    echo El servicio esta instalado pero NO iniciara automaticamente.
    echo.
    echo Para iniciarlo manualmente, ejecuta:
    echo   npm start
    echo.
    echo O instala PM2 manualmente:
    echo   npm install -g pm2
    echo   pm2 start server.js --name impresion
    echo   pm2 save
    echo   pm2 startup
    echo.
)

REM Mostrar informacion importante
echo ============================================
echo  INFORMACION IMPORTANTE
echo ============================================
echo.

REM Obtener IP automaticamente
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set ip=%%a
    set ip=!ip:~1!
    goto :found_ip
)
:found_ip

REM Obtener token del .env
for /f "tokens=2 delims==" %%a in ('findstr PRINT_SERVICE_TOKEN .env') do set token=%%a

echo Tu IP local es: !ip!
echo Tu token es: !token!
echo.
echo ============================================
echo  ENVIA ESTOS DATOS AL DESARROLLADOR:
echo ============================================
echo.
echo IP: !ip!
echo Token: !token!
echo.
echo El desarrollador los configurara en Vercel.
echo.
echo El servicio esta escuchando en el puerto 3001
echo.
echo ============================================
echo.

pause

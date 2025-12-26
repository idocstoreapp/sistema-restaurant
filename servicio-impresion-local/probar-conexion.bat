@echo off
setlocal enabledelayedexpansion
echo ============================================
echo  PROBAR CONEXION DEL SERVICIO
echo ============================================
echo.

echo [1] Verificando que el servicio este corriendo...
powershell -Command "Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force; pm2 status"
echo.

echo [2] Obteniendo IP local...
set "ip="
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    if not defined ip (
        set "temp=%%a"
        set "temp=!temp:~1!"
        set "temp=!temp: =!"
        if "!temp!" neq "" (
            set "ip=!temp!"
        )
    )
)

if not defined ip (
    echo Intentando metodo alternativo...
    for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
        if not defined ip (
            set "temp=%%a"
            set "temp=!temp: =!"
            if "!temp!" neq "" (
                set "ip=!temp!"
            )
        )
    )
)

if defined ip (
    echo Tu IP es: !ip!
    echo.
    echo [3] Probando conexion local...
    echo El servicio solo acepta POST, probando con POST...
    powershell -Command "try { $body = @{type='test';orden=@{numero_orden='TEST'};items=@()} | ConvertTo-Json; $response = Invoke-WebRequest -Uri 'http://!ip!:3001' -Method POST -Body $body -ContentType 'application/json' -TimeoutSec 5; Write-Host 'OK: Servicio respondiendo correctamente' } catch { if ($_.Exception.Response.StatusCode -eq 401) { Write-Host 'OK: Servicio responde (401 = requiere autenticacion, esto es normal)' } elseif ($_.Exception.Response.StatusCode -eq 405) { Write-Host 'OK: Servicio responde (405 = metodo no permitido, pero el servidor esta activo)' } else { Write-Host 'ERROR: Servicio no responde -' $_.Exception.Message } }"
) else (
    echo ERROR: No se pudo obtener la IP automaticamente
    echo.
    echo Ejecuta: obtener-ip.bat para obtener la IP manualmente
)
echo.
echo [4] Verificando puerto 3001...
netstat -an | findstr ":3001"
echo.

echo.
echo ============================================
echo  VERIFICACION COMPLETA
echo ============================================
echo.
echo Si el servicio esta corriendo y el puerto 3001 esta escuchando,
echo entonces el problema puede estar en:
echo 1. Variables no configuradas en Vercel
echo 2. El servidor de Vercel no puede alcanzar esta IP
echo 3. Firewall bloqueando el puerto 3001
echo.
pause


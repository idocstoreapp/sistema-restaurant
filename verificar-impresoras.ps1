# Script para verificar informacion de impresoras en Windows
# Ejecutar en PowerShell: .\verificar-impresoras.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INFORMACION DE IMPRESORAS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Impresoras instaladas
Write-Host "IMPRESORAS INSTALADAS:" -ForegroundColor Yellow
Write-Host ""
Get-Printer | Select-Object Name, PortName, DriverName, PrinterStatus | Format-Table -AutoSize

Write-Host ""
Write-Host "PUERTOS DE IMPRESORA:" -ForegroundColor Yellow
Write-Host ""
Get-PrinterPort | Where-Object { $_.Name -like "*IP_*" -or $_.Name -like "*TCP*" } | Select-Object Name, Description | Format-Table -AutoSize

Write-Host ""
Write-Host "PUERTOS COM (USB):" -ForegroundColor Yellow
Write-Host ""
Get-WmiObject Win32_SerialPort | Select-Object DeviceID, Description, Name | Format-Table -AutoSize

Write-Host ""
Write-Host "DISPOSITIVOS EN LA RED:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Para ver dispositivos en tu red, ejecuta:" -ForegroundColor Gray
Write-Host "  arp -a" -ForegroundColor White
Write-Host ""
Write-Host "O usa un escaner de red como Advanced IP Scanner" -ForegroundColor Gray

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURACION PARA .env" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Extraer IPs de los puertos
$ipPorts = Get-PrinterPort | Where-Object { $_.Name -like "*IP_*" -or $_.Name -like "*TCP*" }
if ($ipPorts) {
    Write-Host "Para impresoras por RED (network):" -ForegroundColor Green
    foreach ($port in $ipPorts) {
        $ip = $port.Name -replace "IP_", "" -replace ".*_", ""
        if ($ip -match "^\d+\.\d+\.\d+\.\d+$") {
            Write-Host ""
            Write-Host "PRINTER_KITCHEN_TYPE=network" -ForegroundColor White
            Write-Host "PRINTER_KITCHEN_IP=$ip" -ForegroundColor White
            Write-Host "PRINTER_KITCHEN_PORT=9100" -ForegroundColor White
            Write-Host ""
        }
    }
} else {
    Write-Host "No se encontraron impresoras por red configuradas" -ForegroundColor Yellow
}

# Extraer puertos COM
$comPorts = Get-WmiObject Win32_SerialPort | Where-Object { $_.Description -like "*printer*" -or $_.Description -like "*thermal*" -or $_.Name -like "*COM*" }
if ($comPorts) {
    Write-Host "Para impresoras USB:" -ForegroundColor Green
    foreach ($port in $comPorts) {
        Write-Host ""
        Write-Host "PRINTER_KITCHEN_TYPE=usb" -ForegroundColor White
        Write-Host "PRINTER_KITCHEN_PATH=$($port.DeviceID)" -ForegroundColor White
        Write-Host ""
    }
} else {
    Write-Host "No se encontraron impresoras USB detectadas" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "TIP: Revisa el archivo GUIA_CONFIGURAR_IMPRESORAS.md para mas detalles" -ForegroundColor Cyan
Write-Host ""

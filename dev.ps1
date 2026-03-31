# ============================================================
#  DeskFlow – Entorno de desarrollo
#  Uso: .\dev.ps1
# ============================================================

$root   = $PSScriptRoot
$api    = Join-Path $root "src\DeskFlow.API"
$web    = Join-Path $root "src\DeskFlow.Web"

Write-Host ""
Write-Host "  DeskFlow Dev" -ForegroundColor Cyan
Write-Host "  Iniciando API y Frontend..." -ForegroundColor Cyan
Write-Host ""

# API en ventana separada
Start-Process powershell -ArgumentList "-NoExit", "-Command",
    "Write-Host '[API] Iniciando...' -ForegroundColor Green; Set-Location '$api'; dotnet run"

Start-Sleep -Seconds 1

# Frontend en ventana separada
Start-Process powershell -ArgumentList "-NoExit", "-Command",
    "Write-Host '[WEB] Iniciando Vite...' -ForegroundColor Blue; Set-Location '$web'; npm run dev"

Write-Host "  API  → http://localhost:5000" -ForegroundColor Green
Write-Host "  WEB  → http://localhost:5173" -ForegroundColor Blue
Write-Host ""
Write-Host "  Abriendo dos ventanas de terminal..." -ForegroundColor Gray
Write-Host "  (Cerrá las ventanas para detener los servicios)" -ForegroundColor Gray
Write-Host ""

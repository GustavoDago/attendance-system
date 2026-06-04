<#
.SYNOPSIS
    Script para construir y copiar el JAR directamente a la carpeta de producción V2.
.DESCRIPTION
    Compila el frontend y el backend, y copia el archivo JAR final a C:\Users\estudiante\Documents\V2\
    eliminando el JAR anterior.
#>

$ErrorActionPreference = "Stop"

$PROJECT_ROOT = (Get-Item -Path ".\").FullName
$FRONTEND_DIR = Join-Path $PROJECT_ROOT "frontend"
$BACKEND_DIR = Join-Path $PROJECT_ROOT "backend"
$DESTINATION_DIR = "C:\Users\estudiante\Documents\V2"
$DESTINATION_JAR = Join-Path $DESTINATION_DIR "attendance-system.jar"

Write-Host "Iniciando proceso de Build y despliegue local a V2..." -ForegroundColor Cyan

# 1. Compilar Frontend
Write-Host "`n[1/3] Compilando Frontend (React/Vite)..." -ForegroundColor Yellow
Set-Location $FRONTEND_DIR
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias de npm..."
    cmd.exe /c npm install
}
cmd.exe /c npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Falló la compilación del frontend."
    exit 1
}

# 2. Copiar Frontend al Backend
Write-Host "`n[2/3] Copiando frontend al backend..." -ForegroundColor Yellow
$STATIC_DIR = Join-Path $BACKEND_DIR "src\main\resources\static"
if (Test-Path $STATIC_DIR) {
    Remove-Item -Recurse -Force $STATIC_DIR
}
New-Item -ItemType Directory -Force -Path $STATIC_DIR | Out-Null
Copy-Item -Recurse -Force (Join-Path $FRONTEND_DIR "dist\*") $STATIC_DIR

# 3. Compilar Backend
Write-Host "`n[3/3] Compilando Backend (Spring Boot)..." -ForegroundColor Yellow
Set-Location $BACKEND_DIR
mvn clean package -DskipTests
if ($LASTEXITCODE -ne 0) {
    Write-Error "Falló la compilación del backend."
    exit 1
}

# 4. Desplegar en la carpeta de destino V2
Write-Host "`n[4/4] Desplegando archivo JAR a $DESTINATION_DIR..." -ForegroundColor Yellow
Set-Location $PROJECT_ROOT

# Asegurar que el directorio de destino exista
if (-not (Test-Path $DESTINATION_DIR)) {
    New-Item -ItemType Directory -Force -Path $DESTINATION_DIR | Out-Null
}

# Borrar el archivo JAR original/anterior en el destino si existe
if (Test-Path $DESTINATION_JAR) {
    Write-Host "Borrando archivo JAR anterior en destino..." -ForegroundColor DarkYellow
    Remove-Item -Force $DESTINATION_JAR
}

# Buscar el JAR recién compilado
$JAR_FILE = Get-ChildItem -Path (Join-Path $BACKEND_DIR "target") -Filter "attendance-backend-*.jar" | Where-Object { $_.Name -notmatch "plain" } | Select-Object -First 1

if (-not $JAR_FILE) {
    Write-Error "No se encontró el archivo JAR compilado."
    exit 1
}

# Copiar al destino
Copy-Item $JAR_FILE.FullName $DESTINATION_JAR

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "¡Build y despliegue completados con éxito!" -ForegroundColor Green
Write-Host "El archivo JAR está listo en: $DESTINATION_JAR" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green

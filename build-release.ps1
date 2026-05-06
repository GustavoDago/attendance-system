<#
.SYNOPSIS
    Script para construir el paquete de release para la notebook.

.DESCRIPTION
    Este script automatiza el proceso de compilación del frontend y backend,
    y empaqueta el resultado en un archivo .zip listo para ser transferido
    a la notebook de producción.
#>

$ErrorActionPreference = "Stop"

$PROJECT_ROOT = (Get-Item -Path ".\").FullName
$FRONTEND_DIR = Join-Path $PROJECT_ROOT "frontend"
$BACKEND_DIR = Join-Path $PROJECT_ROOT "backend"
$RELEASE_DIR = Join-Path $PROJECT_ROOT "release"
$RELEASE_ZIP = Join-Path $PROJECT_ROOT "attendance-system-release.zip"

Write-Host "Iniciando proceso de Build para Notebook..." -ForegroundColor Cyan

# 1. Limpiar directorio de release
if (Test-Path $RELEASE_DIR) {
    Remove-Item -Recurse -Force $RELEASE_DIR
}
New-Item -ItemType Directory -Force -Path $RELEASE_DIR | Out-Null

if (Test-Path $RELEASE_ZIP) {
    Remove-Item -Force $RELEASE_ZIP
}

# 2. Compilar Frontend
Write-Host "`n[1/4] Compilando Frontend (React/Vite)..." -ForegroundColor Yellow
Set-Location $FRONTEND_DIR
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias de npm..."
    npm install
}
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Fallo la compilación del frontend."
    exit 1
}

# 3. Copiar Frontend al Backend
Write-Host "`n[2/4] Copiando frontend al backend..." -ForegroundColor Yellow
$STATIC_DIR = Join-Path $BACKEND_DIR "src\main\resources\static"
if (Test-Path $STATIC_DIR) {
    Remove-Item -Recurse -Force $STATIC_DIR
}
New-Item -ItemType Directory -Force -Path $STATIC_DIR | Out-Null
Copy-Item -Recurse -Force (Join-Path $FRONTEND_DIR "dist\*") $STATIC_DIR

# 4. Compilar Backend
Write-Host "`n[3/4] Compilando Backend (Spring Boot)..." -ForegroundColor Yellow
Set-Location $BACKEND_DIR
mvn clean package -DskipTests
if ($LASTEXITCODE -ne 0) {
    Write-Error "Fallo la compilación del backend."
    exit 1
}

# 5. Preparar la carpeta de Release
Write-Host "`n[4/4] Preparando paquete de Release..." -ForegroundColor Yellow
Set-Location $PROJECT_ROOT

# Buscar el JAR compilado
$JAR_FILE = Get-ChildItem -Path (Join-Path $BACKEND_DIR "target") -Filter "attendance-backend-*.jar" | Where-Object { $_.Name -notmatch "plain" } | Select-Object -First 1

if (-not $JAR_FILE) {
    Write-Error "No se encontro el archivo JAR compilado."
    exit 1
}

Copy-Item $JAR_FILE.FullName (Join-Path $RELEASE_DIR "attendance-system.jar")

# Crear el script de inicio para la notebook (.bat)
$START_SCRIPT = Join-Path $RELEASE_DIR "iniciar-sistema.bat"
$batContent = @"
@echo off
title Sistema de Asistencia
echo ========================================================
echo Iniciando Sistema de Asistencia (Modo Notebook)
echo ========================================================
echo.
echo Asegurate de tener Java 17 o superior instalado.
echo Puedes descargar Java desde: https://adoptium.net/es/
echo.
echo Presiona Ctrl+C para detener el servidor.
echo.
start http://localhost:8080/
java -Xmx512m -jar attendance-system.jar --spring.profiles.active=notebook
pause
"@

Set-Content -Path $START_SCRIPT -Value $batContent -Encoding UTF8

# Crear archivo README en el release
$README_SCRIPT = Join-Path $RELEASE_DIR "LEER-PRIMERO.txt"
$readmeContent = @"
Instrucciones de Instalación:
1. Asegúrate de que la notebook tenga instalado Java 17 o superior (por ejemplo, JDK 17.0.12).
2. Para iniciar el sistema, haz doble clic en el archivo 'iniciar-sistema.bat'.
3. El sistema se abrirá automáticamente en tu navegador por defecto.
4. Los datos se guardarán automáticamente en una carpeta llamada 'data' que aparecerá aquí. Haz copias de seguridad de esa carpeta periódicamente.
"@
Set-Content -Path $README_SCRIPT -Value $readmeContent -Encoding UTF8

# Comprimir la carpeta de release
Write-Host "Creando archivo .zip..."
Compress-Archive -Path (Join-Path $RELEASE_DIR "*") -DestinationPath $RELEASE_ZIP -Force

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "¡Build completado con éxito!" -ForegroundColor Green
Write-Host "El paquete está listo en: $RELEASE_ZIP" -ForegroundColor Green
Write-Host "Copia este archivo .zip a la notebook, descomprímelo y ejecuta iniciar-sistema.bat" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green

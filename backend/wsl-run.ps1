# =============================================================================
# wsl-run.ps1
# Ejecuta el binario nativo de Spring Boot directamente en WSL Debian.
# La app quedará escuchando en http://localhost:8080
#
# Uso: .\wsl-run.ps1
# =============================================================================

$WSL_DISTRO  = "Debian"
$BINARY_NAME = "attendance-backend"
$APP_PORT    = 8080

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗"
Write-Host "║    Spring Native — Ejecutando en WSL         ║"
Write-Host "╚══════════════════════════════════════════════╝"
Write-Host ""

# ─── Verificar que el binario exista en WSL ───────────────────────────────────
$binaryExists = wsl -d $WSL_DISTRO -- bash -c "test -f ~/$BINARY_NAME && echo yes || echo no"
if ($binaryExists -ne "yes") {
    Write-Error "El binario '~/$BINARY_NAME' no existe en WSL."
    Write-Host "  Compilá primero con: .\wsl-deploy.ps1"
    exit 1
}

Write-Host "  Binario encontrado: ~/$BINARY_NAME ✓"
Write-Host ""
Write-Host "  Iniciando servidor Spring Boot..."
Write-Host "  URL: http://localhost:$APP_PORT"
Write-Host ""
Write-Host "  Presioná Ctrl+C para detener el servidor."
Write-Host ""
Write-Host "─────────────────────────────────────────────────"

# Ejecutar con variables de entorno si las necesitas.
# Spring Boot usa las propiedades del application.properties por defecto.
# Podés sobreescribir cualquier propiedad con variables de entorno aquí:
#   SERVER_PORT=8080    → sobreescribe server.port
#   SPRING_PROFILES_ACTIVE=prod  → activa un perfil específico

wsl -d $WSL_DISTRO -- bash -c @"
    export SERVER_PORT=$APP_PORT
    export SPRING_PROFILES_ACTIVE=default
    ~/attendance-backend
"@

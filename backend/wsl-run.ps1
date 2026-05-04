# =============================================================================
# wsl-run.ps1
# Ejecuta el binario nativo de Spring Boot directamente en WSL Debian.
# La app quedará escuchando en http://localhost:8080
# =============================================================================

$WSL_DISTRO  = "Debian"
$BINARY_NAME = "attendance-backend"
$APP_PORT    = 8080

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗"
Write-Host "║    Spring Native — Ejecutando en WSL         ║"
Write-Host "╚══════════════════════════════════════════════╝"
Write-Host ""

# Verificar que el binario exista en WSL
$checkCmd = "if [ -f ~/$BINARY_NAME ]; then echo 'yes'; else echo 'no'; fi"
$binaryExists = wsl -d $WSL_DISTRO -- bash -c $checkCmd
if ($binaryExists -notmatch "yes") {
    Write-Error "El binario '~/$BINARY_NAME' no existe en WSL."
    Write-Host "  Compilá primero con: .\wsl-deploy.ps1"
    exit 1
}

Write-Host "  Binario encontrado: ~/$BINARY_NAME ✓"
Write-Host ""
Write-Host "  Iniciando servidor Spring Boot..."
Write-Host "  URL: http://localhost:$APP_PORT"
Write-Host ""

# Ejecutar el binario
wsl -d $WSL_DISTRO -- bash -c "export SERVER_PORT=$APP_PORT; export SPRING_PROFILES_ACTIVE=default; ~/$BINARY_NAME"

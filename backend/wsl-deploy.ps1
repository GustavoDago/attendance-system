# =============================================================================
# wsl-deploy.ps1
# Orquesta el proceso de compilación nativa en WSL Debian.
# Copia el código fuente al WSL, ejecuta la compilación y extrae el binario.
#
# Uso: .\wsl-deploy.ps1
# =============================================================================

$WSL_DISTRO    = "Debian"
$BACKEND_PATH  = "F:\Mochila\Antigravity\attendance-system\backend"
$FRONTEND_PATH = "F:\Mochila\Antigravity\attendance-system\frontend"
$BINARY_NAME   = "attendance-backend"
$LOCAL_TARGET  = "$BACKEND_PATH\target"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗"
Write-Host "║    Spring Native — Deploy via WSL Debian     ║"
Write-Host "╚══════════════════════════════════════════════╝"
Write-Host ""

# ─── Verificar que WSL y la distro existan ───────────────────────────────────
Write-Host "[Pre] Verificando WSL y distro '$WSL_DISTRO'..."

$wslList = wsl --list --quiet 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "WSL no está instalado o no está habilitado."
    Write-Host "  Habilita WSL con: wsl --install"
    exit 1
}

$distroExists = $false
foreach ($line in $wslList) {
    # Eliminar posibles caracteres nulos devueltos por wsl.exe en Windows
    $cleanLine = $line -replace "`0", ""
    if ($cleanLine -match $WSL_DISTRO) {
        $distroExists = $true
        break
    }
}

if (-not $distroExists) {
    Write-Error "La distro '$WSL_DISTRO' no está instalada en WSL."
    Write-Host ""
    Write-Host "  Para instalarla, corre:"
    Write-Host "    wsl --install -d Debian"
    Write-Host ""
    Write-Host "  Luego, la primera vez que abras Debian en WSL,"
    Write-Host "  configura tu usuario y contraseña, y volvé a correr este script."
    exit 1
}
Write-Host "  WSL y distro '$WSL_DISTRO' encontrados. ✓"

# ─── Paso 1: Preparar directorio en WSL ──────────────────────────────────────
Write-Host ""
Write-Host "[1/4] Preparando directorio de build en WSL..."
wsl -d $WSL_DISTRO -- bash -c "rm -rf ~/attendance-build ~/frontend-build && mkdir -p ~/attendance-build/src ~/frontend-build"
if ($LASTEXITCODE -ne 0) { Write-Error "Fallo al preparar directorio."; exit 1 }
Write-Host "  Directorios ~/attendance-build y ~/frontend-build listos. ✓"

# ─── Paso 2: Copiar fuentes al WSL ───────────────────────────────────────────
Write-Host ""
Write-Host "[2/4] Copiando código fuente al WSL..."

$wslBackendPath = "/mnt/f/Mochila/Antigravity/attendance-system/backend"
$wslFrontendPath = "/mnt/f/Mochila/Antigravity/attendance-system/frontend"

wsl -d $WSL_DISTRO -- bash -c "cp '$wslBackendPath/pom.xml' ~/attendance-build/"
if ($LASTEXITCODE -ne 0) { Write-Error "Fallo al copiar pom.xml."; exit 1 }

wsl -d $WSL_DISTRO -- bash -c "cp -r '$wslBackendPath/src' ~/attendance-build/"
if ($LASTEXITCODE -ne 0) { Write-Error "Fallo al copiar backend src/."; exit 1 }

# Copiar frontend omitiendo node_modules y .git
wsl -d $WSL_DISTRO -- bash -c "rsync -a --exclude 'node_modules' --exclude '.git' '$wslFrontendPath/' ~/frontend-build/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ¡Advertencia! rsync falló, intentando cp simple..."
    wsl -d $WSL_DISTRO -- bash -c "cp -r '$wslFrontendPath/src' '$wslFrontendPath/public' '$wslFrontendPath/package.json' '$wslFrontendPath/vite.config.js' '$wslFrontendPath/index.html' ~/frontend-build/"
	if ($LASTEXITCODE -ne 0) { Write-Error "Fallo al copiar frontend."; exit 1 }
}

wsl -d $WSL_DISTRO -- bash -c "cp '$wslBackendPath/wsl-setup-and-build.sh' ~/"
if ($LASTEXITCODE -ne 0) { Write-Error "Fallo al copiar wsl-setup-and-build.sh."; exit 1 }

Write-Host "  Backend, frontend y script copiados localmente a WSL. ✓"

# ─── Paso 3: Ejecutar compilación en WSL ─────────────────────────────────────
Write-Host ""
Write-Host "[3/4] Ejecutando compilación nativa en WSL..."
Write-Host "  (Esto puede tardar entre 10 y 30 minutos la primera vez)"
Write-Host ""

wsl -d $WSL_DISTRO -- bash -c "chmod +x ~/wsl-setup-and-build.sh && ~/wsl-setup-and-build.sh"

if ($LASTEXITCODE -ne 0) {
    Write-Error "La compilación falló."
    Write-Host ""
    Write-Host "  Para ver el log completo, corre:"
    Write-Host "    wsl -d $WSL_DISTRO -- cat ~/attendance-build.log"
    exit 1
}

# ─── Paso 4: Extraer binario al sistema Windows ──────────────────────────────
Write-Host ""
Write-Host "[4/4] Extrayendo binario compilado a Windows..."

if (-not (Test-Path $LOCAL_TARGET)) {
    New-Item -ItemType Directory -Path $LOCAL_TARGET | Out-Null
}

# Copiar desde WSL al filesystem de Windows usando el montaje directo /mnt/
$localBinary = "$LOCAL_TARGET\$BINARY_NAME-linux"
$wslOutputPath = "/mnt/f/Mochila/Antigravity/attendance-system/backend/target/attendance-backend-linux"
wsl -d $WSL_DISTRO -- bash -c "cp ~/$BINARY_NAME '$wslOutputPath'"
if ($LASTEXITCODE -ne 0) { Write-Error "Fallo al extraer el binario."; exit 1 }

$sizeBytes = (Get-Item $localBinary).Length
$sizeMB    = [math]::Round($sizeBytes / 1MB, 1)

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗"
Write-Host "║           ¡Compilación completada!           ║"
Write-Host "╠══════════════════════════════════════════════╣"
Write-Host "║  Binario en Windows: target\$BINARY_NAME-linux"
Write-Host "║  Tamaño: $sizeMB MB"
Write-Host "╚══════════════════════════════════════════════╝"
Write-Host ""
Write-Host "Ejecuta la app con: .\wsl-run.ps1"

# =============================================================================
# deploy-local.ps1
# Despliegue a producción vía RED LOCAL (LAN): compila localmente, sube al 
# servidor Debian en la misma red, ejecuta la configuración automática.
#
# Uso: .\deploy-local.ps1
#      .\deploy-local.ps1 -SkipBuild     (solo sube y reinicia)
#      .\deploy-local.ps1 -SetupOnly     (solo configura el servidor)
# =============================================================================

param(
    [switch]$SkipBuild,
    [switch]$SetupOnly,
    [string]$ServerIP = 'debian.local' # Cambiar por la IP local si no funciona .local
)

# ─── Configuración ───────────────────────────────────────────────────────────
$REMOTE_USER   = 'root'
$REMOTE_HOST   = $ServerIP
$APP_DIR       = '/opt/attendance'
$SERVICE_NAME  = 'attendance-backend'

$BACKEND_DIR   = $PSScriptRoot          # Directorio donde está este script
$FRONTEND_DIR  = Join-Path (Split-Path $BACKEND_DIR) 'frontend'
$JAR_NAME      = 'attendance-backend-0.0.1-SNAPSHOT.jar'
$JAR_PATH      = Join-Path $BACKEND_DIR "target\$JAR_NAME"

Write-Host ''
Write-Host '╔══════════════════════════════════════════════════════╗'
Write-Host '║     Despliegue LOCAL (LAN) — Servidor Escuela        ║'
Write-Host '╚══════════════════════════════════════════════════════╝'
Write-Host ''

# ─── 0. Verificar conectividad ───────────────────────────────────────────────
Write-Host "[0/5] Verificando conectividad local con $REMOTE_HOST..."
$sshTest = ssh -o ConnectTimeout=3 -o BatchMode=yes "${REMOTE_USER}@${REMOTE_HOST}" 'echo OK' 2>&1
if ($sshTest -notmatch 'OK') {
    Write-Error "No se puede conectar a ${REMOTE_HOST} en la red local. Verificá que:"
    Write-Host '  1. El servidor esté encendido y conectado a la misma red'
    Write-Host "  2. La IP/Nombre '$REMOTE_HOST' sea correcta"
    Write-Host '  3. SSH esté activo en el servidor'
    Write-Host ''
    Write-Host "  Probá manualmente: ssh ${REMOTE_USER}@${REMOTE_HOST}"
    Write-Host "  Nota: Podés pasar la IP como parámetro: .\deploy-local.ps1 -ServerIP 192.168.1.XX"
    exit 1
}
Write-Host "      Conectado localmente a $REMOTE_HOST. ✓"

if ($SetupOnly) {
    Write-Host ''
    Write-Host '[Setup] Subiendo script de configuración...'
    scp (Join-Path $BACKEND_DIR 'server-setup.sh') "${REMOTE_USER}@${REMOTE_HOST}:/tmp/server-setup.sh"
    ssh "${REMOTE_USER}@${REMOTE_HOST}" 'chmod +x /tmp/server-setup.sh && bash /tmp/server-setup.sh'
    Write-Host ''
    Write-Host '¡Configuración del servidor completada!'
    exit 0
}

# ─── 1. Compilar backend (JAR) ──────────────────────────────────────────────
if (-not $SkipBuild) {
    Write-Host ''
    Write-Host '[1/5] Compilando backend (Maven)...'

    $mvnCmd = 'mvn'
    $mvnCheck = Get-Command mvn -ErrorAction SilentlyContinue
    if (-not $mvnCheck) {
        $mvnwPath = Join-Path $BACKEND_DIR 'mvnw.cmd'
        if (Test-Path $mvnwPath) { $mvnCmd = $mvnwPath }
        else { Write-Error 'Maven no encontrado.'; exit 1 }
    }

    Push-Location $BACKEND_DIR
    & $mvnCmd clean package -DskipTests -q
    $mvnExit = $LASTEXITCODE
    Pop-Location

    if ($mvnExit -ne 0) { Write-Error 'La compilación del backend falló.'; exit 1 }
    if (-not (Test-Path $JAR_PATH)) { Write-Error "No se encontró el JAR en: $JAR_PATH"; exit 1 }

    $jarSize = [math]::Round((Get-Item $JAR_PATH).Length / 1MB, 1)
    Write-Host "      JAR compilado: $JAR_NAME ($jarSize MB) ✓"

    # ─── 2. Compilar frontend ────────────────────────────────────────────────
    Write-Host ''
    Write-Host '[2/5] Compilando frontend (Vite)...'

    if (-not (Test-Path (Join-Path $FRONTEND_DIR 'node_modules'))) {
        Write-Host '      Instalando dependencias (npm install)...'
        Push-Location $FRONTEND_DIR
        npm install --silent
        Pop-Location
    }

    Push-Location $FRONTEND_DIR
    npm run build
    $npmExit = $LASTEXITCODE
    Pop-Location

    if ($npmExit -ne 0) { Write-Error 'La compilación del frontend falló.'; exit 1 }
    $distDir = Join-Path $FRONTEND_DIR 'dist'
    $distFiles = (Get-ChildItem $distDir -Recurse -File).Count
    Write-Host "      Frontend compilado: $distFiles archivos en dist/ ✓"

} else {
    Write-Host ''
    Write-Host '[1/5] Build omitido.'
    Write-Host '[2/5] Build omitido.'
}

# ─── 3. Subir archivos al servidor ──────────────────────────────────────────
Write-Host ''
Write-Host '[3/5] Subiendo archivos al servidor por RED LOCAL...'

$distDir = Join-Path $FRONTEND_DIR 'dist'
$setupScript = Join-Path $BACKEND_DIR 'server-setup.sh'

Write-Host '      Subiendo server-setup.sh...'
scp $setupScript "${REMOTE_USER}@${REMOTE_HOST}:/tmp/server-setup.sh"

Write-Host "      Subiendo $JAR_NAME..."
scp $JAR_PATH "${REMOTE_USER}@${REMOTE_HOST}:${APP_DIR}/${JAR_NAME}.new"

Write-Host '      Subiendo frontend (dist/)...'
$tarFile = Join-Path $BACKEND_DIR 'target\frontend-dist.tar.gz'
Push-Location $distDir
tar -czf $tarFile *
Pop-Location
scp $tarFile "${REMOTE_USER}@${REMOTE_HOST}:/tmp/frontend-dist.tar.gz"
Remove-Item $tarFile -ErrorAction SilentlyContinue

if ($LASTEXITCODE -ne 0) { Write-Error 'Error al transferir archivos.'; exit 1 }
Write-Host '      Todos los archivos subidos (LAN Speed). ✓'

# ─── 4. Ejecutar setup en el servidor ────────────────────────────────────────
Write-Host ''
Write-Host '[4/5] Ejecutando configuración del servidor...'
ssh "${REMOTE_USER}@${REMOTE_HOST}" 'chmod +x /tmp/server-setup.sh && bash /tmp/server-setup.sh'

# ─── 5. Desplegar y reiniciar ────────────────────────────────────────────────
Write-Host ''
Write-Host '[5/5] Desplegando nueva versión y reiniciando servicio...'

$deployCmd = @"
set -e
systemctl stop $SERVICE_NAME 2>/dev/null || true
mv ${APP_DIR}/${JAR_NAME}.new ${APP_DIR}/${JAR_NAME}
chown attendance:attendance ${APP_DIR}/${JAR_NAME}
rm -rf ${APP_DIR}/frontend/*
tar -xzf /tmp/frontend-dist.tar.gz -C ${APP_DIR}/frontend/
chown -R attendance:attendance ${APP_DIR}/frontend/
rm -f /tmp/frontend-dist.tar.gz
chown -R attendance:attendance ${APP_DIR}/data
chown -R attendance:attendance ${APP_DIR}/logs
chown -R attendance:attendance ${APP_DIR}/backups
systemctl start $SERVICE_NAME
echo 'Esperando que el backend arranque...'
sleep 10
if systemctl is-active --quiet $SERVICE_NAME; then
    echo '¡Servicio activo!'
    HTTP_CODE=`curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/api/auth/login 2>/dev/null || echo 000`
    echo "Health check: HTTP \$HTTP_CODE"
else
    echo 'ERROR: El servicio no arrancó.'
    exit 1
fi
"@

ssh "${REMOTE_USER}@${REMOTE_HOST}" $deployCmd

# ─── Resumen final ──────────────────────────────────────────────────────────
Write-Host ''
Write-Host '╔══════════════════════════════════════════════════════╗'
Write-Host '║    ¡Despliegue LOCAL completado con éxito!           ║'
Write-Host '╠══════════════════════════════════════════════════════╣'
Write-Host "║  Frontend: http://${REMOTE_HOST}                     "
Write-Host "║  Backend:  http://${REMOTE_HOST}/api/                "
Write-Host '╚══════════════════════════════════════════════════════╝'
Write-Host ''

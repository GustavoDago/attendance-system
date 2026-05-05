# =============================================================================
# deploy-prod.ps1
# Despliegue a producción: compila localmente, sube al servidor Debian,
# ejecuta la configuración automática del servidor.
#
# Uso: .\deploy-prod.ps1
#      .\deploy-prod.ps1 -SkipBuild     (solo sube y reinicia)
#      .\deploy-prod.ps1 -SetupOnly     (solo configura el servidor)
# =============================================================================

param(
    [switch]$SkipBuild,
    [switch]$SetupOnly
)

# ─── Configuración ───────────────────────────────────────────────────────────
$REMOTE_USER   = 'root'
$REMOTE_HOST   = 'debian'               # Nombre Tailscale (o IP: 100.89.164.110)
$APP_DIR       = '/opt/attendance'
$SERVICE_NAME  = 'attendance-backend'

$BACKEND_DIR   = $PSScriptRoot          # Directorio donde está este script
$FRONTEND_DIR  = Join-Path (Split-Path $BACKEND_DIR) 'frontend'
$JAR_NAME      = 'attendance-backend-0.0.1-SNAPSHOT.jar'
$JAR_PATH      = Join-Path $BACKEND_DIR "target\$JAR_NAME"

Write-Host ''
Write-Host '╔══════════════════════════════════════════════════════╗'
Write-Host '║   Despliegue a Producción — Servidor Escuela        ║'
Write-Host '╚══════════════════════════════════════════════════════╝'
Write-Host ''

# ─── 0. Verificar conectividad ───────────────────────────────────────────────
Write-Host '[0/5] Verificando conectividad con el servidor...'
$sshTest = ssh -o ConnectTimeout=5 -o BatchMode=yes "${REMOTE_USER}@${REMOTE_HOST}" 'echo OK' 2>&1
if ($sshTest -notmatch 'OK') {
    Write-Error "No se puede conectar a ${REMOTE_HOST}. Verificá que:"
    Write-Host '  1. El servidor esté encendido'
    Write-Host '  2. Tailscale esté conectado en ambas máquinas'
    Write-Host '  3. SSH esté activo en el servidor'
    Write-Host ''
    Write-Host "  Probá manualmente: ssh ${REMOTE_USER}@${REMOTE_HOST}"
    exit 1
}
Write-Host "      Conectado a $REMOTE_HOST. ✓"

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

    # Verificar que Maven esté disponible
    $mvnCheck = Get-Command mvn -ErrorAction SilentlyContinue
    if (-not $mvnCheck) {
        # Intentar con mvnw
        $mvnwPath = Join-Path $BACKEND_DIR 'mvnw.cmd'
        if (Test-Path $mvnwPath) {
            $mvnCmd = $mvnwPath
        } else {
            Write-Error 'Maven no encontrado. Instalá Maven o usá el wrapper (mvnw).'
            exit 1
        }
    } else {
        $mvnCmd = 'mvn'
    }

    Push-Location $BACKEND_DIR
    & $mvnCmd clean package -DskipTests -q
    $mvnExit = $LASTEXITCODE
    Pop-Location

    if ($mvnExit -ne 0) {
        Write-Error 'La compilación del backend falló.'
        exit 1
    }

    if (-not (Test-Path $JAR_PATH)) {
        Write-Error "No se encontró el JAR en: $JAR_PATH"
        Write-Host '  Verificá que la versión en pom.xml coincida con el nombre esperado.'
        exit 1
    }

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

    if ($npmExit -ne 0) {
        Write-Error 'La compilación del frontend falló.'
        exit 1
    }

    $distDir = Join-Path $FRONTEND_DIR 'dist'
    if (-not (Test-Path $distDir)) {
        Write-Error "No se encontró la carpeta dist/ en: $distDir"
        exit 1
    }

    $distFiles = (Get-ChildItem $distDir -Recurse -File).Count
    Write-Host "      Frontend compilado: $distFiles archivos en dist/ ✓"

} else {
    Write-Host ''
    Write-Host '[1/5] Build omitido (flag -SkipBuild). Usando artefactos existentes.'
    Write-Host '[2/5] Build omitido.'

    if (-not (Test-Path $JAR_PATH)) {
        Write-Error "No se encontró el JAR: $JAR_PATH. Ejecutá sin -SkipBuild."
        exit 1
    }
}

# ─── 3. Subir archivos al servidor ──────────────────────────────────────────
Write-Host ''
Write-Host '[3/5] Subiendo archivos al servidor...'

$distDir = Join-Path $FRONTEND_DIR 'dist'
$setupScript = Join-Path $BACKEND_DIR 'server-setup.sh'

# Subir script de setup
Write-Host '      Subiendo server-setup.sh...'
scp $setupScript "${REMOTE_USER}@${REMOTE_HOST}:/tmp/server-setup.sh"

# Subir JAR
Write-Host "      Subiendo $JAR_NAME..."
scp $JAR_PATH "${REMOTE_USER}@${REMOTE_HOST}:${APP_DIR}/${JAR_NAME}.new"

# Subir frontend (comprimir para velocidad)
Write-Host '      Subiendo frontend (dist/)...'
$tarFile = Join-Path $BACKEND_DIR 'target\frontend-dist.tar.gz'
Push-Location $distDir
tar -czf $tarFile *
Pop-Location
scp $tarFile "${REMOTE_USER}@${REMOTE_HOST}:/tmp/frontend-dist.tar.gz"
Remove-Item $tarFile -ErrorAction SilentlyContinue

if ($LASTEXITCODE -ne 0) {
    Write-Error 'Error al transferir archivos. Verificá el acceso SSH.'
    exit 1
}

Write-Host '      Todos los archivos subidos. ✓'

# ─── 4. Ejecutar setup en el servidor ────────────────────────────────────────
Write-Host ''
Write-Host '[4/5] Ejecutando configuración del servidor...'

ssh "${REMOTE_USER}@${REMOTE_HOST}" 'chmod +x /tmp/server-setup.sh && bash /tmp/server-setup.sh'

if ($LASTEXITCODE -ne 0) {
    Write-Error 'La configuración del servidor falló.'
    exit 1
}

# ─── 5. Desplegar y reiniciar ────────────────────────────────────────────────
Write-Host ''
Write-Host '[5/5] Desplegando nueva versión y reiniciando servicio...'

$deployCmd = @"
set -e

# Parar el servicio
systemctl stop $SERVICE_NAME 2>/dev/null || true

# Reemplazar JAR (atómico)
mv ${APP_DIR}/${JAR_NAME}.new ${APP_DIR}/${JAR_NAME}
chown attendance:attendance ${APP_DIR}/${JAR_NAME}

# Desplegar frontend
rm -rf ${APP_DIR}/frontend/*
tar -xzf /tmp/frontend-dist.tar.gz -C ${APP_DIR}/frontend/
chown -R attendance:attendance ${APP_DIR}/frontend/
rm -f /tmp/frontend-dist.tar.gz

# Asegurar permisos del directorio de datos
chown -R attendance:attendance ${APP_DIR}/data
chown -R attendance:attendance ${APP_DIR}/logs
chown -R attendance:attendance ${APP_DIR}/backups

# Iniciar servicio
systemctl start $SERVICE_NAME

# Esperar a que arranque y verificar
echo ''
echo 'Esperando que el backend arranque (15 seg)...'
sleep 15

if systemctl is-active --quiet $SERVICE_NAME; then
    echo '¡Servicio activo!'
    # Test rápido
    HTTP_CODE=`curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/api/auth/login 2>/dev/null || echo 000`
    echo "Health check: HTTP \$HTTP_CODE"
else
    echo 'ERROR: El servicio no arrancó correctamente.'
    echo '--- Últimas líneas del log ---'
    tail -30 ${APP_DIR}/logs/backend-stderr.log 2>/dev/null
    exit 1
fi
"@

ssh "${REMOTE_USER}@${REMOTE_HOST}" $deployCmd

if ($LASTEXITCODE -ne 0) {
    Write-Error 'El despliegue falló. Revisá los logs en el servidor.'
    Write-Host "  ssh ${REMOTE_USER}@${REMOTE_HOST} 'journalctl -u ${SERVICE_NAME} -n 50'"
    exit 1
}

# ─── Resumen final ──────────────────────────────────────────────────────────
Write-Host ''
Write-Host '╔══════════════════════════════════════════════════════╗'
Write-Host '║         ¡Despliegue completado con éxito!           ║'
Write-Host '╠══════════════════════════════════════════════════════╣'
Write-Host "║  Frontend: http://${REMOTE_HOST}                     "
Write-Host "║  Backend:  http://${REMOTE_HOST}/api/                "
Write-Host "║  Servicio: systemctl status ${SERVICE_NAME}          "
Write-Host "║  Logs:     journalctl -u ${SERVICE_NAME} -f         "
Write-Host '╚══════════════════════════════════════════════════════╝'
Write-Host ''
Write-Host 'Comandos útiles:'
Write-Host "  Ver logs:          ssh ${REMOTE_USER}@${REMOTE_HOST} 'journalctl -u ${SERVICE_NAME} -f'"
Write-Host "  Reiniciar:         ssh ${REMOTE_USER}@${REMOTE_HOST} 'systemctl restart ${SERVICE_NAME}'"
Write-Host "  Backup manual:     ssh ${REMOTE_USER}@${REMOTE_HOST} '/opt/attendance/backup.sh'"
Write-Host "  Redesplegar rápido: .\deploy-prod.ps1 -SkipBuild"
Write-Host ''

# =============================================================================
# deploy-prod.ps1
# Despliegue a producciÃ³n: compila localmente, sube al servidor Debian,
# ejecuta la configuraciÃ³n automÃ¡tica del servidor.
#
# Uso: .\deploy-prod.ps1
#      .\deploy-prod.ps1 -SkipBuild     (solo sube y reinicia)
#      .\deploy-prod.ps1 -SetupOnly     (solo configura el servidor)
# =============================================================================

param(
    [switch]$SkipBuild,
    [switch]$SetupOnly
)

# â”€â”€â”€ ConfiguraciÃ³n â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
$REMOTE_USER   = 'root'
$REMOTE_HOST   = 'debian'               # Nombre Tailscale (o IP: 100.89.164.110)
$APP_DIR       = '/opt/attendance'
$SERVICE_NAME  = 'attendance-backend'

$BACKEND_DIR   = $PSScriptRoot          # Directorio donde estÃ¡ este script
$FRONTEND_DIR  = Join-Path (Split-Path $BACKEND_DIR) 'frontend'
$JAR_NAME      = 'attendance-backend-0.0.1-SNAPSHOT.jar'
$JAR_PATH      = Join-Path $BACKEND_DIR "target\$JAR_NAME"

Write-Host ''
Write-Host 'â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—'
Write-Host 'â•‘   Despliegue a ProducciÃ³n â€” Servidor Escuela        â•‘'
Write-Host 'â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•'
Write-Host ''

# â”€â”€â”€ 0. Verificar conectividad â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Write-Host '[0/5] Verificando conectividad con el servidor...'
$sshTest = ssh -o ConnectTimeout=5 -o BatchMode=yes "${REMOTE_USER}@${REMOTE_HOST}" 'echo OK' 2>&1
if ($sshTest -notmatch 'OK') {
    Write-Error "No se puede conectar a ${REMOTE_HOST}. VerificÃ¡ que:"
    Write-Host '  1. El servidor estÃ© encendido'
    Write-Host '  2. Tailscale estÃ© conectado en ambas mÃ¡quinas'
    Write-Host '  3. SSH estÃ© activo en el servidor'
    Write-Host ''
    Write-Host "  ProbÃ¡ manualmente: ssh ${REMOTE_USER}@${REMOTE_HOST}"
    exit 1
}
Write-Host "      Conectado a $REMOTE_HOST. âœ“"

if ($SetupOnly) {
    Write-Host ''
    Write-Host '[Setup] Subiendo script de configuraciÃ³n...'
    scp (Join-Path $BACKEND_DIR 'server-setup.sh') "${REMOTE_USER}@${REMOTE_HOST}:/tmp/server-setup.sh"
    ssh "${REMOTE_USER}@${REMOTE_HOST}" 'chmod +x /tmp/server-setup.sh && bash /tmp/server-setup.sh'
    Write-Host ''
    Write-Host 'Â¡ConfiguraciÃ³n del servidor completada!'
    exit 0
}

# â”€â”€â”€ 1. Compilar backend (JAR) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
if (-not $SkipBuild) {
    Write-Host ''
    Write-Host '[1/5] Compilando backend (Maven)...'

    # Verificar que Maven estÃ© disponible
    $mvnCheck = Get-Command mvn -ErrorAction SilentlyContinue
    if (-not $mvnCheck) {
        # Intentar con mvnw
        $mvnwPath = Join-Path $BACKEND_DIR 'mvnw.cmd'
        if (Test-Path $mvnwPath) {
            $mvnCmd = $mvnwPath
        } else {
            Write-Error 'Maven no encontrado. InstalÃ¡ Maven o usÃ¡ el wrapper (mvnw).'
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
        Write-Error 'La compilaciÃ³n del backend fallÃ³.'
        exit 1
    }

    if (-not (Test-Path $JAR_PATH)) {
        Write-Error "No se encontrÃ³ el JAR en: $JAR_PATH"
        Write-Host '  VerificÃ¡ que la versiÃ³n en pom.xml coincida con el nombre esperado.'
        exit 1
    }

    $jarSize = [math]::Round((Get-Item $JAR_PATH).Length / 1MB, 1)
    Write-Host "      JAR compilado: $JAR_NAME ($jarSize MB) âœ“"

    # â”€â”€â”€ 2. Compilar frontend â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        Write-Error 'La compilaciÃ³n del frontend fallÃ³.'
        exit 1
    }

    $distDir = Join-Path $FRONTEND_DIR 'dist'
    if (-not (Test-Path $distDir)) {
        Write-Error "No se encontrÃ³ la carpeta dist/ en: $distDir"
        exit 1
    }

    $distFiles = (Get-ChildItem $distDir -Recurse -File).Count
    Write-Host "      Frontend compilado: $distFiles archivos en dist/ âœ“"

}
if ($SkipBuild) {
    Write-Host ''
    Write-Host '[1/5] Build omitido (flag -SkipBuild). Usando artefactos existentes.'
    Write-Host '[2/5] Build omitido.'

    if (-not (Test-Path $JAR_PATH)) {
        Write-Error "No se encontrÃ³ el JAR: $JAR_PATH. EjecutÃ¡ sin -SkipBuild."
        exit 1
    }
}

# â”€â”€â”€ 3. Subir archivos al servidor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    Write-Error 'Error al transferir archivos. VerificÃ¡ el acceso SSH.'
    exit 1
}

Write-Host '      Todos los archivos subidos. âœ“'

# â”€â”€â”€ 4. Ejecutar setup en el servidor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Write-Host ''
Write-Host '[4/5] Ejecutando configuraciÃ³n del servidor...'

ssh "${REMOTE_USER}@${REMOTE_HOST}" 'chmod +x /tmp/server-setup.sh && bash /tmp/server-setup.sh'

if ($LASTEXITCODE -ne 0) {
    Write-Error 'La configuraciÃ³n del servidor fallÃ³.'
    exit 1
}

# â”€â”€â”€ 5. Desplegar y reiniciar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Write-Host ''
Write-Host '[5/5] Desplegando nueva versiÃ³n y reiniciando servicio...'

$deployCmdTemplate = @'
set -e

# Parar el servicio
systemctl stop __SERVICE_NAME__ 2>/dev/null || true

# Reemplazar JAR (atÃ³mico)
mv __APP_DIR__/__JAR_NAME__.new __APP_DIR__/__JAR_NAME__
chown attendance:attendance __APP_DIR__/__JAR_NAME__

# Desplegar frontend
rm -rf __APP_DIR__/frontend/*
tar -xzf /tmp/frontend-dist.tar.gz -C __APP_DIR__/frontend/
chown -R attendance:attendance __APP_DIR__/frontend/
rm -f /tmp/frontend-dist.tar.gz

# Asegurar permisos del directorio de datos
chown -R attendance:attendance __APP_DIR__/data
chown -R attendance:attendance __APP_DIR__/logs
chown -R attendance:attendance __APP_DIR__/backups

# Iniciar servicio
systemctl start __SERVICE_NAME__

# Esperar a que arranque y verificar
echo ''
echo 'Esperando que el backend arranque (15 seg)...'
sleep 15

if systemctl is-active --quiet __SERVICE_NAME__; then
    echo 'Â¡Servicio activo!'
    # Test rÃ¡pido
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/api/auth/login 2>/dev/null || echo 000)
    echo "Health check: HTTP $HTTP_CODE"
else
    echo 'ERROR: El servicio no arrancÃ³ correctamente.'
    echo '--- Ãšltimas lÃ­neas del log ---'
    tail -30 __APP_DIR__/logs/backend-stderr.log 2>/dev/null
    exit 1
fi
'@

$deployCmd = $deployCmdTemplate.Replace('__SERVICE_NAME__', $SERVICE_NAME).Replace('__APP_DIR__', $APP_DIR).Replace('__JAR_NAME__', $JAR_NAME)

ssh "${REMOTE_USER}@${REMOTE_HOST}" $deployCmd

if ($LASTEXITCODE -ne 0) {
    Write-Error 'El despliegue fallÃ³. RevisÃ¡ los logs en el servidor.'
    Write-Host "  ssh ${REMOTE_USER}@${REMOTE_HOST} 'journalctl -u ${SERVICE_NAME} -n 50'"
    exit 1
}

# â”€â”€â”€ Resumen final â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Write-Host ''
Write-Host 'â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—'
Write-Host 'â•‘         Â¡Despliegue completado con Ã©xito!           â•‘'
Write-Host 'â• â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•£'
Write-Host "â•‘  Frontend: http://${REMOTE_HOST}                     "
Write-Host "â•‘  Backend:  http://${REMOTE_HOST}/api/                "
Write-Host "â•‘  Servicio: systemctl status ${SERVICE_NAME}          "
Write-Host "â•‘  Logs:     journalctl -u ${SERVICE_NAME} -f         "
Write-Host 'â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•'
Write-Host ''
Write-Host 'Comandos Ãºtiles:'
Write-Host "  Ver logs:          ssh ${REMOTE_USER}@${REMOTE_HOST} 'journalctl -u ${SERVICE_NAME} -f'"
Write-Host "  Reiniciar:         ssh ${REMOTE_USER}@${REMOTE_HOST} 'systemctl restart ${SERVICE_NAME}'"
Write-Host "  Backup manual:     ssh ${REMOTE_USER}@${REMOTE_HOST} '/opt/attendance/backup.sh'"
Write-Host "  Redesplegar rÃ¡pido: .\deploy-prod.ps1 -SkipBuild"
Write-Host ''

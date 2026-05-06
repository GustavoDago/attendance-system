param(
    [switch]$SkipBuild
)

$REMOTE_USER = "root"
$REMOTE_HOST = "192.168.1.160"
$APP_DIR = "/opt/attendance"
$SERVICE_NAME = "attendance-backend"
$JAR_NAME = "attendance-backend-0.0.1-SNAPSHOT.jar"

Write-Host "Iniciando despliegue a $REMOTE_HOST..."

if (-not $SkipBuild) {
    Write-Host "Compilando backend..."
    & mvn clean package -DskipTests -q
    if ($LASTEXITCODE -ne 0) { throw "Error al compilar backend" }

    Write-Host "Compilando frontend..."
    Push-Location ../frontend
    npm run build
    Pop-Location
}

$BACKEND_JAR = "target\$JAR_NAME"
$FRONTEND_DIST = "../frontend/dist"

Write-Host "Subiendo archivos..."
scp server-setup.sh "${REMOTE_USER}@${REMOTE_HOST}:/tmp/server-setup.sh"
scp $BACKEND_JAR "${REMOTE_USER}@${REMOTE_HOST}:${APP_DIR}/${JAR_NAME}.new"

Push-Location $FRONTEND_DIST
tar -czf ../../backend/target/frontend-dist.tar.gz *
Pop-Location
scp target/frontend-dist.tar.gz "${REMOTE_USER}@${REMOTE_HOST}:/tmp/frontend-dist.tar.gz"

Write-Host "Configurando servidor..."
ssh "${REMOTE_USER}@${REMOTE_HOST}" "chmod +x /tmp/server-setup.sh && bash /tmp/server-setup.sh"

Write-Host "Reiniciando servicios..."
$deployCmd = "systemctl stop $SERVICE_NAME ; mv ${APP_DIR}/${JAR_NAME}.new ${APP_DIR}/${JAR_NAME} ; chown attendance:attendance ${APP_DIR}/${JAR_NAME} ; rm -rf ${APP_DIR}/frontend/* ; tar -xzf /tmp/frontend-dist.tar.gz -C ${APP_DIR}/frontend/ ; chown -R attendance:attendance ${APP_DIR}/frontend/ ; systemctl start $SERVICE_NAME"
ssh "${REMOTE_USER}@${REMOTE_HOST}" $deployCmd

Write-Host "Despliegue finalizado."

# =============================================================================
# deploy-remote.ps1
# Versión: Limpieza nuclear de puerto
# =============================================================================

$REMOTE_USER = 'gustavodagoberto'
$REMOTE_IP   = '100.89.164.110'
$BINARY_NAME = 'attendance-backend-linux'
$LOCAL_PATH  = 'target\' + $BINARY_NAME
$REMOTE_DEST = '/home/' + $REMOTE_USER + '/attendance-backend'

Write-Host ' '
Write-Host '--------------------------------------------'
Write-Host '   Despliegue Remoto - Servidor Escuela     '
Write-Host '--------------------------------------------'

# 1. Verificar binario local
if (-not (Test-Path $LOCAL_PATH)) {
    Write-Error ('No se encuentra el binario en ' + $LOCAL_PATH)
    exit 1
}

Write-Host '[1/3] Limpiando puerto 8080 de forma exhaustiva...'
# Intentamos matar por puerto (usando varias herramientas) y por nombre
$stopCmd = 'pkill -9 -f attendance-backend ; '
$stopCmd += 'pkill -9 -f java ; '
$stopCmd += 'fuser -k 8080/tcp ; '
$stopCmd += 'kill -9 $(lsof -t -i:8080) ; '
$stopCmd += 'kill -9 $(netstat -ltnp | grep :8080 | awk "{print $7}" | cut -d/ -f1) ; '
$stopCmd += 'rm -f attendance.log ; sleep 4'

# Nota: ignoramos errores si alguno de estos comandos falla (ej: si lsof no existe)
ssh ($REMOTE_USER + '@' + $REMOTE_IP) $stopCmd

Write-Host ('[2/3] Transfiriendo binario a ' + $REMOTE_IP + '...')
scp $LOCAL_PATH ($REMOTE_USER + '@' + $REMOTE_IP + ':' + $REMOTE_DEST)

if ($LASTEXITCODE -ne 0) {
    Write-Error 'Error al transferir. Verifica el acceso SSH.'
    exit 1
}

Write-Host '[3/3] Iniciando nueva version en segundo plano...'
$startCmd = 'chmod +x ' + $REMOTE_DEST + ' ; '
$startCmd += 'nohup ' + $REMOTE_DEST + ' > attendance.log 2>&1 & '
$startCmd += 'sleep 6 ; tail -n 50 attendance.log'

ssh ($REMOTE_USER + '@' + $REMOTE_IP) $startCmd

Write-Host ' '
Write-Host '!!! Despliegue completado !!!'
Write-Host ('URL: http://' + $REMOTE_IP + ':8080')
Write-Host ' '

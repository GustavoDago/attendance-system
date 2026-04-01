Write-Host "Iniciando la construcción de la imagen de Docker (esto tomará algo de tiempo debido a que GraalVM consume altos recursos y CPU)..."
docker build -t attendance-native-builder -f Dockerfile.nativeBuilder .
if ($LASTEXITCODE -ne 0) {
    Write-Error "Fallo la construcción de la imagen Docker."
    exit 1
}

Write-Host "Extrayendo el binario nativo compilado del contenedor..."
docker create --name temp-native-container attendance-native-builder

# Crear el directorio target si no existe
if (-not (Test-Path -Path "target\")) {
    New-Item -ItemType Directory -Path "target\" | Out-Null
}

# Copiar archivo
docker cp temp-native-container:/app/target/attendance-backend ./target/attendance-backend-linux

Write-Host "Limpiando servidor (borrando contenedor temporal)..."
docker rm temp-native-container

Write-Host "¡Completado! El ejecutable está listo en target/attendance-backend-linux"

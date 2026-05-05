#!/bin/bash
# =============================================================================
# server-setup.sh
# Script de configuración del servidor Debian para el sistema de asistencias.
# Instala Java 21 JRE, Nginx, configura systemd y backup automático.
#
# IDEMPOTENTE: se puede ejecutar múltiples veces sin efectos adversos.
# Uso: bash server-setup.sh
# =============================================================================
set -e

APP_DIR="/opt/attendance"
APP_USER="attendance"
JAR_NAME="attendance-backend.jar"
SERVICE_NAME="attendance-backend"
BACKUP_DIR="/opt/attendance/backups"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   Servidor de Asistencias — Configuración           ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ─── Verificación de root ────────────────────────────────────────────────────
if [ "$(id -u)" -ne 0 ]; then
    echo "ERROR: Este script debe ejecutarse como root."
    echo "  Uso: sudo bash server-setup.sh"
    exit 1
fi

# ─── 1. Java 21 JRE ─────────────────────────────────────────────────────────
echo "[1/6] Verificando Java 21..."

if command -v java > /dev/null 2>&1; then
    JAVA_VER=$(java -version 2>&1 | head -1 | awk -F '"' '{print $2}' | cut -d. -f1)
    if [ "$JAVA_VER" = "21" ]; then
        echo "      Java 21 ya está instalado. ✓"
        java -version 2>&1 | head -1
    else
        echo "      Java encontrado pero versión $JAVA_VER, se necesita 21."
        echo "      Instalando Java 21..."
        INSTALL_JAVA=true
    fi
else
    echo "      Java no encontrado. Instalando..."
    INSTALL_JAVA=true
fi

if [ "${INSTALL_JAVA}" = "true" ]; then
    # Agregar repositorio de Adoptium (Eclipse Temurin)
    apt-get update -qq
    apt-get install -y -qq wget apt-transport-https gnupg > /dev/null 2>&1

    # Instalar la clave GPG de Adoptium
    wget -qO - https://packages.adoptium.net/artifactory/api/gpg/key/public | \
        gpg --dearmor -o /usr/share/keyrings/adoptium.gpg 2>/dev/null

    # Agregar el repositorio
    echo "deb [signed-by=/usr/share/keyrings/adoptium.gpg] https://packages.adoptium.net/artifactory/deb $(. /etc/os-release && echo $VERSION_CODENAME) main" \
        > /etc/apt/sources.list.d/adoptium.list

    apt-get update -qq
    apt-get install -y -qq temurin-21-jre > /dev/null 2>&1

    echo "      Java 21 JRE (Temurin) instalado. ✓"
    java -version 2>&1 | head -1
fi

# ─── 2. Nginx ────────────────────────────────────────────────────────────────
echo ""
echo "[2/6] Verificando Nginx..."

if command -v nginx > /dev/null 2>&1; then
    echo "      Nginx ya está instalado. ✓"
    nginx -v 2>&1
else
    echo "      Nginx no encontrado. Instalando..."
    apt-get install -y -qq nginx > /dev/null 2>&1
    echo "      Nginx instalado. ✓"
    nginx -v 2>&1
fi

# ─── 3. Estructura de directorios y usuario ──────────────────────────────────
echo ""
echo "[3/6] Preparando estructura de directorios..."

# Crear usuario de sistema para la app (sin login, sin home)
if ! id "$APP_USER" > /dev/null 2>&1; then
    useradd --system --no-create-home --shell /usr/sbin/nologin "$APP_USER"
    echo "      Usuario '$APP_USER' creado. ✓"
else
    echo "      Usuario '$APP_USER' ya existe. ✓"
fi

# Crear directorios
mkdir -p "$APP_DIR"
mkdir -p "$APP_DIR/data"
mkdir -p "$APP_DIR/frontend"
mkdir -p "$BACKUP_DIR"
mkdir -p "$APP_DIR/logs"

# Permisos: el usuario attendance es dueño de todo
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

echo "      Directorios creados en $APP_DIR. ✓"

# ─── 4. Configuración de Nginx ──────────────────────────────────────────────
echo ""
echo "[4/6] Configurando Nginx como reverse proxy..."

cat > /etc/nginx/sites-available/attendance << 'NGINX_CONF'
server {
    listen 80;
    server_name _;

    # === Frontend estático ===
    root /opt/attendance/frontend;
    index index.html;

    # Límites razonables para uploads (importación de Excel, etc.)
    client_max_body_size 10M;

    # SPA: todas las rutas que no sean archivos reales caen a index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # === Reverse proxy al backend Spring Boot ===
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_read_timeout 120s;
    }

    # === Bloquear acceso a H2 console ===
    location /h2-console {
        deny all;
    }

    # === Logs ===
    access_log /opt/attendance/logs/nginx-access.log;
    error_log /opt/attendance/logs/nginx-error.log;
}
NGINX_CONF

# Habilitar el sitio, deshabilitar el default
ln -sf /etc/nginx/sites-available/attendance /etc/nginx/sites-enabled/attendance
rm -f /etc/nginx/sites-enabled/default

# Verificar la config y reiniciar
nginx -t
systemctl enable nginx
systemctl restart nginx

echo "      Nginx configurado y activo. ✓"

# ─── 5. Servicio systemd ────────────────────────────────────────────────────
echo ""
echo "[5/6] Configurando servicio systemd..."

cat > /etc/systemd/system/${SERVICE_NAME}.service << SYSTEMD_CONF
[Unit]
Description=Sistema de Asistencias - Backend Spring Boot
After=network.target
Documentation=https://github.com/GustavoDago/attendance-system

[Service]
Type=simple
User=${APP_USER}
Group=${APP_USER}
WorkingDirectory=${APP_DIR}
ExecStart=/usr/bin/java -Xmx512m -Xms256m -jar ${APP_DIR}/${JAR_NAME} --spring.profiles.active=prod
Restart=always
RestartSec=10
StandardOutput=append:${APP_DIR}/logs/backend-stdout.log
StandardError=append:${APP_DIR}/logs/backend-stderr.log

# Seguridad: limitar lo que puede hacer el proceso
NoNewPrivileges=true
ProtectSystem=strict
ReadWritePaths=${APP_DIR}/data ${APP_DIR}/logs ${BACKUP_DIR}

[Install]
WantedBy=multi-user.target
SYSTEMD_CONF

systemctl daemon-reload
systemctl enable "$SERVICE_NAME"

echo "      Servicio '$SERVICE_NAME' configurado y habilitado. ✓"

# ─── 6. Backup automático (cron) ────────────────────────────────────────────
echo ""
echo "[6/6] Configurando backup automático diario..."

# Script de backup
cat > /opt/attendance/backup.sh << 'BACKUP_SCRIPT'
#!/bin/bash
# =============================================================================
# backup.sh — Backup diario de la base de datos H2
# Retiene los últimos 30 backups (un mes de historia).
# =============================================================================

BACKUP_DIR="/opt/attendance/backups"
DB_FILE="/opt/attendance/data/attendance_db.mv.db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/attendance_db_${TIMESTAMP}.mv.db"

# Solo hacer backup si existe la base de datos
if [ -f "$DB_FILE" ]; then
    cp "$DB_FILE" "$BACKUP_FILE"
    
    # Comprimir para ahorrar espacio
    gzip "$BACKUP_FILE"
    
    echo "[$(date)] Backup creado: ${BACKUP_FILE}.gz ($(du -sh "${BACKUP_FILE}.gz" | cut -f1))"
    
    # Eliminar backups más viejos que 30 días
    find "$BACKUP_DIR" -name "attendance_db_*.mv.db.gz" -mtime +30 -delete
    
    echo "[$(date)] Limpieza completada. Backups actuales: $(ls -1 "$BACKUP_DIR"/*.gz 2>/dev/null | wc -l)"
else
    echo "[$(date)] AVISO: No se encontró $DB_FILE — nada que respaldar."
fi
BACKUP_SCRIPT

chmod +x /opt/attendance/backup.sh
chown "$APP_USER:$APP_USER" /opt/attendance/backup.sh

# Cron: backup diario a las 03:00 AM
CRON_LINE="0 3 * * * /opt/attendance/backup.sh >> /opt/attendance/logs/backup.log 2>&1"

# Agregar al crontab del usuario attendance (idempotente)
( crontab -u "$APP_USER" -l 2>/dev/null | grep -v "backup.sh" ; echo "$CRON_LINE" ) | crontab -u "$APP_USER" -

echo "      Backup automático configurado: diario a las 03:00 AM. ✓"
echo "      Retención: 30 días (un mes de historia)."
echo "      Directorio de backups: $BACKUP_DIR"

# ─── Resumen ────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║         ¡Configuración completada!                  ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║                                                      ║"
echo "║  Java:      $(java -version 2>&1 | head -1)"
echo "║  Nginx:     $(nginx -v 2>&1)"
echo "║  Servicio:  $SERVICE_NAME (systemd)"
echo "║  App dir:   $APP_DIR"
echo "║  DB:        $APP_DIR/data/attendance_db.mv.db"
echo "║  Backups:   $BACKUP_DIR (diario 03:00, 30 días)"
echo "║  Logs:      $APP_DIR/logs/"
echo "║                                                      ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "  Para iniciar manualmente:  systemctl start $SERVICE_NAME"
echo "  Para ver logs en vivo:     journalctl -u $SERVICE_NAME -f"
echo "  Para backup manual:        /opt/attendance/backup.sh"
echo ""

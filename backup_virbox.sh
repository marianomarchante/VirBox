#!/bin/bash

# =========================================================================
# VirBox Backup Utility - Integral (BD + Proyecto) - Docker Ready
# =========================================================================

# 1. Configuración principal
USER="virbox"
DATABASE="virbox_db"
PROJECT_DIR="/home/mm/VirBox" # Ruta en el nuevo Ubuntu Server

# 2. Rutas de Backup
BACKUP_LOCAL="/home/mm/virbox_backups"
GD_REMOTE="gdrive"
GD_FOLDER="VirBox_Backups"

# 3. Datos de Telegram
TELEGRAM_BOT_TOKEN="8748833547:AAGdbfVhlpW_QDdCiS2BgHtlDXaLyGb-roc"
TELEGRAM_CHAT_ID="8657166466"

# 4. Formato y Fecha
TIMESTAMP=$(date +"%d-%m-%Y_%H-%M-%S")
DAY_OF_WEEK=$(date +"%u") # 1=Lunes, 7=Domingo
IS_SUNDAY=false
if [ "$DAY_OF_WEEK" -eq 7 ]; then IS_SUNDAY=true; fi

# Función para mandar notificaciones por Telegram
mandar_telegram() {
    local MENSAJE="$1"
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
        -d chat_id="${TELEGRAM_CHAT_ID}" \
        -d text="${MENSAJE}" > /dev/null
}

# Crear carpetas locales si no existen
mkdir -p "$BACKUP_LOCAL"

# =========================================================================
# PARTE A: Copia de Seguridad de la Base de Datos (DIARIA)
# =========================================================================

DB_FILENAME="virbox_db_${TIMESTAMP}.sql"
DB_FILE="${BACKUP_LOCAL}/${DB_FILENAME}"

echo "--- Iniciando Dump de Base de Datos ---"
# Al usar Docker, podemos extraer el dump de la BBDD desde el contenedor:
docker exec -t virbox-db pg_dump -U "$USER" "$DATABASE" > "$DB_FILE"

if [ $? -eq 0 ]; then
    DB_STATUS="✅ DB Local OK"
    # Subir a Google Drive
    rclone copyto "$DB_FILE" "${GD_REMOTE}:${GD_FOLDER}/diario/${DB_FILENAME}"
    if [ $? -eq 0 ]; then
        DB_GD_STATUS="☁️ DB Cloud OK"
    else
        DB_GD_STATUS="❌ DB Cloud FALLÓ"
    fi
else
    DB_STATUS="❌ DB Local FALLÓ"
    DB_GD_STATUS="🛑 DB Cloud OMITIDO"
fi

# =========================================================================
# PARTE B: Copia de Seguridad Integral (SEMANAL - DOMINGOS)
# =========================================================================

FULL_STATUS=""
if [ "$IS_SUNDAY" = true ]; then
    echo "--- Iniciando Backup Integral Semanal ---"
    FULL_DIR_NAME="virbox_full_backup_${TIMESTAMP}"
    TEMP_DIR="/tmp/${FULL_DIR_NAME}"
    mkdir -p "$TEMP_DIR"

    # 1. Copia del Proyecto (excluyendo carpetas innecesarias para el despliegue Docker)
    mkdir -p "$TEMP_DIR/project"
    rsync -av --exclude 'node_modules' --exclude '.git' --exclude 'dist' "$PROJECT_DIR/" "$TEMP_DIR/project/" > /dev/null

    # Ya no respaldamos nginx ni config global de postgres porque ahora todo corre en Docker Compose
    # y la configuración está en el propio código (docker-compose.yml, Dockerfile, etc).

    # Comprimir todo
    FULL_FILENAME="${FULL_DIR_NAME}.tar.gz"
    FULL_FILE="${BACKUP_LOCAL}/${FULL_FILENAME}"
    tar -czf "$FULL_FILE" -C "/tmp" "$FULL_DIR_NAME"
    
    if [ $? -eq 0 ]; then
        FULL_STATUS="📦 Integral Local OK"
        # Subir a Google Drive
        rclone copyto "$FULL_FILE" "${GD_REMOTE}:${GD_FOLDER}/semanal/${FULL_FILENAME}"
        if [ $? -eq 0 ]; then
            FULL_GD_STATUS="☁️ Integral Cloud OK"
        else
            FULL_GD_STATUS="❌ Integral Cloud FALLÓ"
        fi
    else
        FULL_STATUS="❌ Integral Local FALLÓ"
    fi

    # Limpieza temporal
    rm -rf "$TEMP_DIR"
fi

# =========================================================================
# PARTE C: Limpieza y Notificación
# =========================================================================

# Eliminar archivos locales antiguos (45 días)
find "$BACKUP_LOCAL" -type f -mtime +45 -delete

# Mensaje final
RESUMEN="🚀 VirBox Backup Report (${TIMESTAMP})
---------------------------------------
Base de Datos:
${DB_STATUS}
${DB_GD_STATUS}"

if [ "$IS_SUNDAY" = true ]; then
    RESUMEN="${RESUMEN}

Backup Integral (Semanal):
${FULL_STATUS}
${FULL_GD_STATUS}"
fi

echo "$RESUMEN"
mandar_telegram "$RESUMEN"

exit 0

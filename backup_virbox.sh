#!/bin/bash

# =========================================================================
# VirBox Backup Utility - postgresql
# =========================================================================

# 1. Configuración principal
USER="mariano"
DATABASE="virbox"

# 2. Configura aquí la ruta hacia el DISCO DURO EXTERNO
# Ajustado a la ruta que ya utilizas en TloRegalo
BACKUP_DIR="/mnt/backup_disk/virbox_backups"

# 3. Datos de Telegram (Opcional pero recomendado)
# Rellena tu token y chat id aquí:
TELEGRAM_BOT_TOKEN="8748833547:AAGdbfVhlpW_QDdCiS2BgHtlDXaLyGb-roc"
TELEGRAM_CHAT_ID="8657166466"

# Función interna para mandar el telegramazo
mandar_telegram() {
    local MENSAJE="$1"
    if [[ "$TELEGRAM_BOT_TOKEN" != "PON_AQUI_EL_TOKEN_DEL_BOT" ]]; then
        curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -d chat_id="${TELEGRAM_CHAT_ID}" \
            -d text="${MENSAJE}" > /dev/null
    fi
}

# 4. Formato del archivo
TIMESTAMP=$(date +"%d-%m-%Y_%H-%M-%S")
FILENAME="virbox_backup_${TIMESTAMP}.sql"
BACKUP_FILE="${BACKUP_DIR}/${FILENAME}"

# =========================================================================

echo "Iniciando copia de seguridad de la base de datos '${DATABASE}'..."

# Comprobar si el disco externo está montado
if [ ! -d "$BACKUP_DIR" ]; then
    echo "¡Error! No existe la ruta del disco externo: ${BACKUP_DIR}"
    mkdir -p "$BACKUP_DIR"

    if [ ! -d "$BACKUP_DIR" ]; then
        TEXT_ERR="❌ ALERTA VirBox: Fallo crítico en el servidor. No se pudo acceder o montar el disco duro externo para la copia de seguridad de las 3:00 am."
        echo "$TEXT_ERR"
        mandar_telegram "$TEXT_ERR"
        exit 1
    fi
fi

# Ejecutar pg_dump para crear el backup de la base de datos
export PGPASSWORD="kkdvk777"
pg_dump -U "$USER" -h localhost -d "$DATABASE" -F p -f "$BACKUP_FILE"

# Comprobar si se ejecutó correctamente
if [ $? -eq 0 ]; then
    # Opcional: Eliminar archivos más antiguos de 45 días
    find "$BACKUP_DIR" -type f -name "virbox_backup_*.sql" -mtime +45 -exec rm {} \;
    
    # Tamaño del archivo
    FILESIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    
    # Mandamos aviso feliz
    TEXT_OK="✅ VirBox Backup completado con éxito a las 3:00 am.
📂 Archivo: ${FILENAME}
⚖️ Peso: ${FILESIZE}
💾 Guardado correctamente en el disco."
    
    echo "$TEXT_OK"
    mandar_telegram "$TEXT_OK"
    exit 0
else
    TEXT_FAIL="❌ ALERTA VirBox: Se intentó hacer la copia SQL pero el comando de base de datos falló. Se requiere revisión manual."
    echo "$TEXT_FAIL"
    mandar_telegram "$TEXT_FAIL"
    exit 2
fi

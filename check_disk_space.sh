#!/bin/bash

# =========================================================================
# VirBox Disk Space Monitor
# =========================================================================

# 1. Configuración
THRESHOLD_GB=10
THRESHOLD_KB=$((THRESHOLD_GB * 1024 * 1024))

# Datos de Telegram (Mismos que el script de backups)
TELEGRAM_BOT_TOKEN="8748833547:AAGdbfVhlpW_QDdCiS2BgHtlDXaLyGb-roc"
TELEGRAM_CHAT_ID="8657166466"

# Función para enviar mensaje por Telegram
send_telegram() {
  local message=$1
  curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -d chat_id="${TELEGRAM_CHAT_ID}" \
    -d text="${message}" \
    -d parse_mode="HTML" > /dev/null
}

# 2. Comprobar el espacio libre en la partición raíz (/)
# df -P / devuelve los KB libres en la columna 4 de la fila 2
AVAILABLE_KB=$(df -P / | awk 'NR==2 {print $4}')
AVAILABLE_GB=$((AVAILABLE_KB / 1024 / 1024))

# 3. Evaluar y alertar si es necesario
if [ "$AVAILABLE_KB" -lt "$THRESHOLD_KB" ]; then
    MENSAJE="⚠️ <b>¡ALERTA DE ESPACIO EN VIRBOX!</b> ⚠️%0A%0A"
    MENSAJE+="El disco duro principal de tu servidor se está quedando sin espacio.%0A%0A"
    MENSAJE+="💾 <b>Espacio libre actual:</b> ${AVAILABLE_GB} GB%0A"
    MENSAJE+="⛔ <b>Umbral de alerta:</b> ${THRESHOLD_GB} GB%0A%0A"
    MENSAJE+="Por favor, revisa el servidor y libera espacio pronto."
    
    send_telegram "$MENSAJE"
fi

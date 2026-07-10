#!/usr/bin/env bash
# deploy_server.sh — Se ejecuta en el servidor via: ssh mm@... bash -s < deploy_server.sh
# Carga el entorno del usuario (nvm, node, npm) y despliega VirBox.

set -e  # Abortar si cualquier comando falla

APP_DIR="/home/mm/VirBox"
GIT_BRANCH="main"
PM2_APP_NAME="virbox"

# ── Cargar entorno de node (nvm / nodenv / sistema) ──────────────────────────
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    source "$NVM_DIR/nvm.sh"
elif [ -s "$HOME/.bashrc" ]; then
    source "$HOME/.bashrc" 2>/dev/null || true
elif [ -s "$HOME/.bash_profile" ]; then
    source "$HOME/.bash_profile" 2>/dev/null || true
fi

echo ""
echo "── Entorno ──────────────────────────────────────"
echo "  node: $(node -v 2>/dev/null || echo 'NO ENCONTRADO')"
echo "  npm:  $(npm -v  2>/dev/null || echo 'NO ENCONTRADO')"
echo "  pwd:  $APP_DIR"
echo ""

# Verificar que node existe antes de continuar
if ! command -v node &>/dev/null; then
    echo "ERROR: node no encontrado. Instala Node.js en el servidor."
    echo "  Sugerencia: https://github.com/nvm-sh/nvm"
    exit 1
fi

# ── git pull ──────────────────────────────────────────────────────────────────
echo "[servidor 1/3] Actualizando codigo..."
cd "$APP_DIR"
git pull origin "$GIT_BRANCH"

# ── npm install ───────────────────────────────────────────────────────────────
echo ""
echo "[servidor 2/3] Instalando dependencias..."
npm install --include=dev --legacy-peer-deps

# ── esbuild ───────────────────────────────────────────────────────────────────
echo ""
echo "[servidor 3/3] Compilando servidor..."
npx esbuild server/index.ts \
    --platform=node \
    --packages=external \
    --bundle \
    --format=esm \
    --outdir=dist

echo ""
echo "  OK - Compilacion completada: dist/index.js"

# ── PM2 restart ───────────────────────────────────────────────────────────────
echo ""
echo "[servidor] Reiniciando aplicacion..."
if command -v pm2 &>/dev/null; then
    pm2 restart "$PM2_APP_NAME" 2>/dev/null \
        || pm2 restart all 2>/dev/null \
        || echo "AVISO: pm2 no pudo reiniciar. Hazlo manualmente: pm2 restart $PM2_APP_NAME"
else
    echo "AVISO: pm2 no encontrado. Reinicia la aplicacion manualmente."
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo "  SERVIDOR ACTUALIZADO CORRECTAMENTE"
echo "═══════════════════════════════════════════════════"

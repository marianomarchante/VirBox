#!/usr/bin/env bash
# deploy_server.sh - Ejecutado en el servidor via scp + ssh

APP_DIR="/home/mm/VirBox"
GIT_BRANCH="main"
PM2_APP_NAME="virbox"

# Ruta exacta de node en este servidor (Ubuntu, /usr/bin/node)
export PATH="/usr/bin:/usr/local/bin:$PATH"

echo "=== Entorno ==="
echo "  node: $(node -v)"
echo "  npm:  $(npm -v)"
echo "  dir:  $APP_DIR"
echo ""

echo "=== 1/3  git pull ==="
cd "$APP_DIR"
git pull origin "$GIT_BRANCH"

echo ""
echo "=== 2/3  npm install ==="
npm install --include=dev --legacy-peer-deps

echo ""
echo "=== 3/3  esbuild ==="
npx esbuild server/index.ts \
    --platform=node \
    --packages=external \
    --bundle \
    --format=esm \
    --outdir=dist

echo ""
echo "=== Reiniciando PM2 ==="
if command -v pm2 > /dev/null 2>&1; then
    pm2 restart "$PM2_APP_NAME" || pm2 restart all
else
    echo "AVISO: pm2 no encontrado. Reinicia manualmente: pm2 restart $PM2_APP_NAME"
fi

echo ""
echo "=== DESPLIEGUE COMPLETADO ==="

#!/usr/bin/env bash
# deploy_server.sh - Ejecutado en el servidor via scp + ssh

APP_DIR="/home/mm/VirBox"
GIT_BRANCH="main"
PM2_APP_NAME="virbox"

echo "=== Cargando entorno Node.js ==="

# 1. Intentar nvm
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    echo "  -> nvm encontrado, cargando..."
    . "$NVM_DIR/nvm.sh"

# 2. Intentar source de .bashrc
elif [ -f "$HOME/.bashrc" ]; then
    echo "  -> Cargando .bashrc..."
    . "$HOME/.bashrc"

# 3. Intentar source de .profile
elif [ -f "$HOME/.profile" ]; then
    echo "  -> Cargando .profile..."
    . "$HOME/.profile"
fi

# 4. Añadir rutas comunes de node al PATH como fallback
export PATH="/usr/local/bin:/usr/bin:/opt/node/bin:$HOME/.local/bin:$PATH"

echo "  -> node: $(which node 2>/dev/null || echo NO ENCONTRADO)"
echo "  -> npm:  $(which npm  2>/dev/null || echo NO ENCONTRADO)"
echo ""

if ! command -v node > /dev/null 2>&1; then
    echo "ERROR: node no encontrado en el servidor."
    echo "  Instala Node.js con: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
    exit 1
fi

echo "=== 1/3  git pull ==="
cd "$APP_DIR" || exit 1
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
    echo "AVISO: pm2 no encontrado. Reinicia manualmente."
fi

echo ""
echo "=== DESPLIEGUE COMPLETADO ==="

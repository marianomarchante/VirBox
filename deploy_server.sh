#!/usr/bin/env bash
# deploy_server.sh - Ejecutado en el servidor via scp + ssh

APP_DIR="/home/mm/VirBox"
GIT_BRANCH="main"

export PATH="/usr/bin:/usr/local/bin:$PATH"

echo "=== Entorno ==="
echo "  node: $(node -v)"
echo "  docker: $(docker -v)"
echo ""

echo "=== 1/3  git pull ==="
cd "$APP_DIR"
git pull origin "$GIT_BRANCH"

echo ""
echo "=== 2/3  Reconstruyendo imagen Docker ==="
docker compose build app

echo ""
echo "=== 3/3  Reiniciando contenedor ==="
docker compose up -d app

echo ""
echo "=== Contenedores activos ==="
docker compose ps

echo ""
echo "=== DESPLIEGUE COMPLETADO ==="

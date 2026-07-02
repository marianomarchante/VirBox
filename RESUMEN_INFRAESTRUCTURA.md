# 🚀 Resumen de Infraestructura VirBox (Julio 2026)

Este documento resume los cambios importantes y la arquitectura actual del servidor tras la gran migración y estabilización.

## 1. Arquitectura en Contenedores (Docker)
La aplicación ha dejado de ejecutarse directamente en el sistema operativo y ahora está "empaquetada" en contenedores independientes y seguros.
- **virbox-app**: El motor principal de la aplicación web.
- **virbox-db**: La base de datos PostgreSQL.
- **virbox-cloudflared**: El túnel seguro de Cloudflare.

**Dato clave:** Todos los contenedores tienen la instrucción `restart: always`. En caso de apagón, el sistema entero volverá a funcionar automáticamente al encenderse el servidor.

## 2. Acceso y Red (Cloudflare Tunnel)
Ya no hay puertos abiertos en el router ni riesgos de seguridad.
El contenedor `virbox-cloudflared` conecta el servidor internamente con los servidores de Cloudflare.
- **Dominio principal:** `virbox.sinsolo.uk`
- El tráfico se redirige internamente al contenedor web por el puerto `5000`.

## 3. Copias de Seguridad (Backups)
El script `backup_virbox.sh` ha sido rediseñado para hacer una copia doble (Redundancia):
- **Copia Local:** Se guarda en la partición dedicada del disco secundario (`/backups/virbox_backups`).
- **Copia en la Nube:** Se envía cifrada a **Google Drive** usando la herramienta `rclone`.
- Se avisa siempre por **Telegram** del estado de la copia.
- Está automatizado en el sistema para ejecutarse todas las noches a las **3:00 AM**.

## 4. Monitorización de Espacio
Se ha creado un script vigilante llamado `check_disk_space.sh`.
- Comprueba que el disco duro principal tenga al menos 10 GB libres.
- Si el espacio baja de ese límite, dispara una alerta al móvil mediante **Telegram**.
- Se ejecuta silenciosamente todos los días a las **12:00 PM**.

## 5. Mantenimiento Básico (Chuleta)
Si en el futuro haces cambios en el código desde otro PC, los comandos para actualizar este servidor son siempre los mismos:

```bash
# 1. Bajar los cambios recientes de GitHub
git pull

# 2. Aplicar los cambios en Docker (reconstruir sin borrar datos)
docker compose up -d --build
```

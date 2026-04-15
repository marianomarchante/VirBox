# 📘 VirBox (MiContable) - Documentación Técnica y Configuración

Este documento sirve como "memoria" detallada de la arquitectura, configuración y metodologías del proyecto **VirBox**, diseñado para facilitar su mantenimiento y futuras expansiones (tanto por desarrolladores humanos como por asistencias mediante Inteligencia Artificial).

---

## 💻 1. Stack Tecnológico

**Frontend (Cliente)**
*   **Core**: React 18 + TypeScript.
*   **Build Tool**: Vite.
*   **Enrutamiento**: `wouter` (ligero y basado en hooks).
*   **Estilos y UI**: Tailwind CSS (v3/v4) enriquecido con componentes de **shadcn/ui** construidos sobre Radix UI (sin headless, máxima accesibilidad). 
*   **Formularios**: `react-hook-form` con validación estricta de esquemas usando `zod` (`@hookform/resolvers/zod`).
*   **Gestión de Estado**: `@tanstack/react-query` para fetching, cacheado híbrido y revalidación de estado síncrono con el backend.

**Backend (Servidor)**
*   **Runtime**: Node.js gestionado con `tsx` en desarrollo y `esbuild` para producción.
*   **Framework**: Express.js.
*   **Autenticación**: `passport-local` basado en Sesiones persistentes (las cookies/sesiones se almacenan en PostgreSQL usando `connect-pg-simple`). Las contraseñas de los usuarios se almacenan en la columna `password_hash` encriptadas mediante `bcrypt` (10 rounds).
*   **Base de Datos**: PostgreSQL 16 local.
*   **ORM**: Drizzle ORM (`drizzle-orm` y `drizzle-zod`).

---

## 🏗️ 2. Arquitectura y Patrones (Backend)

El sistema ha sido refactorizado desde los "God Files" para seguir patrones de alta cohesión.

*   `shared/schema.ts` (o `/schemas/`): Contiene la definición canónica de todas las tablas de *Drizzle* y también inyecta mediante `drizzle-zod` las validaciones en ambos lados (cliente/servidor). Tablas principales: `users`, `companies`, `invoices`, `delivery_notes`, `inventory`, `agricultural_receipts`, etc.
*   `server/routes/`: Rutas modulares segregadas por dominio comercial (`billing.routes.ts`, `inventory.routes.ts`, `crm.routes.ts`, etc.).
*   `server/repositories/`: Patrón repositorio donde se albergan individualmente las consultas de la DB, evitando mezclar lógicas. Se orquesta desde `server/storage.ts` que actúa como capa de fachada.
*   `server/middleware/`: Middlewares centralizados para control de autenticación (`isAuthenticated`), permisos de administrador (`isAdmin`) y gestor global de errores JSON.

---

## 🌐 3. Configuración del Servidor y Despliegue (Mini PC Linux)

La fase de producción actual se ejecuta en un servidor casero Linux auto-hospedado (Mini PC) bajo esta infraestructura:

*   **Process Manager (PM2)**: VirBox se ejecuta en proceso oculto/dominante vía PM2 para garantizar el reinicio automático. Existe un script automatizado `reiniciar_linux.sh` (ubicado a nivel global en la carpeta del repositorio gemelo `TloRegalo`) que compila la versión en `dist/` y levanta el servicio del backend en el **puerto 5001**.
*   **Cloudflare Tunnels**: Para emitir la aplicación al público y asegurarla con SSL se utiliza `cloudflared`.
    *   **Dominio Puntero**: El dominio `virbox.sinsolo.uk` está mapeado en la regla `ingress` localmente al puerto HTTP cerrado `localhost:5001`.
*   **Base de datos Producción**: Alojada en `postgresql` de sistema local de Linux (`localhost`). 
    *   La base de datos se llama `virbox`.
    *   El usuario propietario es `mariano`.
*   **Sincronización y Despliegue**: 
    *(Actualización 15/04/2026)*. El servidor Linux ahora está configurado como un **repositorio Git**. Ya no es necesario el envío manual por SFTP para actualizaciones rutinarias.

    **⚠️ Proceso completo y correcto de despliegue en producción:**
    ```bash
    cd /home/mariano/VirBox
    git pull origin main
    npm install          # ← OBLIGATORIO si hay cambios en package.json (instala devDeps necesarias para el build)
    npm run build        # Compila frontend (Vite) y backend (esbuild) en dist/
    pm2 restart virbox   # Reinicia el proceso con el nuevo dist/index.js
    ```
    > **Nota crítica**: El paso `npm install` es imprescindible en el servidor de producción porque `vite` y `esbuild` son `devDependencies`. Si se omite y no están instaladas previamente, `npm run build` fallará con `vite: not found` y el frontend no se compilará, dejando `dist/public` vacío y sirviendo un error 404.

---

## 🛡️ 4. Sistema de Backups y Resiliencia (Integral)

Desde abril de 2026, VirBox cuenta con un sistema de respaldo automatizado e híbrido (Local + Nube) gestionado por el script `backup_virbox.sh`.

### 🛰️ Tecnología: rclone + GitHub
Se utiliza **rclone** para la sincronización con Google Drive mediante un remoto autenticado como `gdrive`.

### 📅 Estrategia de Respaldo:
*   **Backups Diarios (3:00 AM)**: 
    *   **Base de Datos**: Dump SQL completo de la base de datos `virbox`.
    *   **Destino**: `/mnt/backup_disk/virbox_backups` (Local) y `GDrive/VirBox_Backups/diario/` (Nube).
*   **Backups Integrales (Semanales - Domingos)**:
    *   **Código**: Compresión de `/home/mariano/VirBox` (excluyendo basura como `node_modules`).
    *   **Nginx**: Toda la configuración de `/etc/nginx/` (sitios, SSL, etc.).
    *   **PostgreSQL**: Configuración completa de `/etc/postgresql/16/main/`.
    *   **Firewall y Servicios**: Exportación de reglas `iptables` y archivos de servicio `.service` de Systemd.
    *   **Destino**: Almacenado en `GDrive/VirBox_Backups/semanal/`.

### 🔔 Notificaciones
El sistema informa del estado de cada backup (tanto local como en la nube) a través de un Bot de **Telegram**, asegurando que los administradores sepan al instante si una copia ha fallado.

---

## 🔐 5. Casos Especiales y Auth Quirks

**Notas de inicio de sesión de cuentas generadas desde la versión antigua:**
Debido a una migración técnica (de Replit-Oauth a Autenticación Local), algunos usuarios antiguos generados con la versión anterior solo tenían guardado el `email` y carecían de `username` y `password_hash`. A la hora de añadir usuarios anteriores, la base de datos local necesita que la columna `username` reciba una copia exacta del `email` y que se inyecte directamente el `$2b$10$...` hash via bcrypt. 
*(Ref. Ejecutada el 14/04/2026: Actualización manual en la BD producción).*

**Gestión Integrada de Usuarios Administradores**:
*(Actualización 15/04/2026)*. Afortunadamente, se ha integrado por completo un panel visual dentro de la ruta `/usuarios` para el manejo de credenciales. Siempre que inicies sesión con un usuario que tenga `isAdmin: true` en la base de datos, podrás crear usuarios nuevos en el sistema y cambiar contraseñas o nombres por completo con seguridad criptográfica (hashes manejados por `bcrypt` subyacente en las rutas de la API). Por tanto, la administración de usuarios ya no requiere tocar comandos SQL para la creación habitual de inquilinos.

---

## 🧰 6. Scripts de NPM de Uso Diario

*   `npm run dev`: Inicia el servidor express mediante TSX y Vite en modo desarrollo interactivo en el puerto asignado.
*   `npm run build`: Construye el binario y estáticos limpios dentro de `/dist`.
*   `npm run start`: Arranca el servidor node base listo para producción (lee de `dist/index.js`).
*   `npm run db:push`: Empuja tu definición *Drizzle ORM* hacia la base de datos PostgreSQL mapeando los índices y columnas generadas sin borrar los datos existentes. **(Comando crítico cuando se modifican las tablas de `schema.ts`)**.

---

## 💻 8. Entorno de Desarrollo en Windows

*(Añadido 15/04/2026)* El proyecto se puede desarrollar localmente en Windows (PowerShell/CMD) con las siguientes consideraciones:

### Configuración inicial (una sola vez)

1.  **Variables de entorno**: Crear un archivo `.env` en la raíz del proyecto (no se sube a Git):
    ```env
    DATABASE_URL=postgresql://mariano:kkdvk777@localhost:5432/virbox
    PORT=5001
    NODE_ENV=development
    ```
    > Si no tienes PostgreSQL instalado localmente, el servidor arrancará de todas formas en "modo sin base de datos", sirviendo el frontend. El inicio de sesión no funcionará hasta tener la DB disponible.

2.  **Compatibilidad de scripts**: Los scripts de `package.json` usan `cross-env` para gestionar variables de entorno de forma compatible entre Windows y Linux. Es una devDependency que se instala junto al resto con `npm install`.

3.  **Puerto**: La aplicación usa el puerto **5001** por defecto (coincide con el túnel de Cloudflare en producción).

### Problemas conocidos en Windows

| Error | Causa | Solución |
|---|---|---|
| `'NODE_ENV' no se reconoce...` | Scripts escritos con sintaxis Bash | Usar `cross-env` (ya incluido) |
| `Error: listen ENOTSUP` al arrancar | `reusePort: true` no soportado en Windows | Eliminado de `server.listen()` |
| `Unexpected "\x00" in source map` | Archivos corruptos en `node_modules` | Borrar `node_modules` y ejecutar `npm install` |

---

## 📋 9. Histórico de Incidencias

### 15/04/2026 — Error 404 en producción + web no arranca en local

**Síntomas:**
- La URL `https://virbox.sinsolo.uk` devolvía un error 404.
- `npm run dev` fallaba en el entorno de desarrollo Windows con el error `'NODE_ENV' no se reconoce...`.

**Causa raíz (producción):**
El script de build `npm run build` invoca a `vite`, que es una `devDependency`. El servidor de producción tenía `node_modules` incompleto (sin devDeps), por lo que `vite: not found` hacía fallar el build. PM2 reiniciaba el servicio con el `dist/index.js` antiguo, pero `dist/public/` no tenía los archivos del frontend actualizados.

**Causa raíz (local Windows):**
Los scripts de `package.json` usaban la sintaxis `VAR=valor comando` propia de sistemas Unix/bash, incompatible con PowerShell/CMD de Windows.

**Solución aplicada:**
1.  Instalado `cross-env` como devDependency y actualizado `package.json` para usarlo en los scripts `dev`, `start` y `db:push`.
2.  Eliminado `reusePort: true` de `server.listen()` (incompatible con Windows).
3.  Cambiado el puerto por defecto de `5000` a `5001` en `server/index.ts` para consistencia con la configuración de Cloudflare.
4.  Añadido `--env-file=.env` a los scripts para cargar el archivo `.env` automáticamente en Node.js 22+.
5.  En producción: ejecutado `npm install` antes de `npm run build` para instalar todas las dependencias (incluidas devDeps necesarias para compilar).

---

## 🤖 7. Guía Directa para Próximas Asistencias (AI)

Para futuras llamadas en contexto para implementar características, se ha de seguir esta pauta:
1.  **Drizzle Types**: Al pasar algo de Frontend al Backend siempre valida con el esquema inferido de `drizzle-zod` en `shared/schema.ts` (esquemas `insertXSchema`).
2.  **Modificaciones de UI**: Usar los componentes bases creados en `client/src/components/ui` si ya existen. Si hay listas, buscar reciclar o emular `DataTable.tsx` y `EntityForm.tsx`.
3.  **Migraciones**: Toda nueva tabla necesita obligatoriamente tener la columna `id` (uuid v4 de preferencia mapeado nativo gen_random_uuid()) e ir acoplada con `.extend({ companyId })` cuando corresponda separar la tenencia (Multi-tenancy).
4.  **Si se hacen cambios en las tablas**: Recuerda que el servidor Linux remoto necesitará lanzar internamente el comando de `drizzle-kit push` para verse reflejado, por lo que a la IA en el futuro se le debe avisar de *desplegar cambios en la estructura de DB en el remoto*.
5.  **Despliegue en producción**: El proceso correcto siempre es `git pull → npm install → npm run build → pm2 restart virbox`. No omitir `npm install` aunque no parezca necesario.
6.  **Entorno local Windows**: La aplicación tiene un archivo `.env` (no subido a Git) con `DATABASE_URL`, `PORT=5001` y `NODE_ENV=development`. Si la DB no está disponible localmente, el servidor arranca igualmente para servir el frontend.

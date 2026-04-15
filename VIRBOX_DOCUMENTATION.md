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

---

## 🔐 4. Casos Especiales y Auth Quirks

**Notas de inicio de sesión de cuentas generadas desde la versión antigua:**
Debido a una migración técnica (de Replit-Oauth a Autenticación Local), algunos usuarios antiguos generados con la versión anterior solo tenían guardado el `email` y carecían de `username` y `password_hash`. A la hora de añadir usuarios anteriores, la base de datos local necesita que la columna `username` reciba una copia exacta del `email` y que se inyecte directamente el `$2b$10$...` hash via bcrypt. 
*(Ref. Ejecutada el 14/04/2026: Actualización manual en la BD producción).*

---

## 🧰 5. Scripts de NPM de Uso Diario

*   `npm run dev`: Inicia el servidor express mediante TSX y Vite en modo desarrollo interactivo en el puerto asignado.
*   `npm run build`: Construye el binario y estáticos limpios dentro de `/dist`.
*   `npm run start`: Arranca el servidor node base listo para producción (lee de `dist/index.js`).
*   `npm run db:push`: Empuja tu definición *Drizzle ORM* hacia la base de datos PostgreSQL mapeando los índices y columnas generadas sin borrar los datos existentes. **(Comando crítico cuando se modifican las tablas de `schema.ts`)**.

---

## 🤖 6. Guía Directa para Próximas Asistencias (AI)

Para futuras llamadas en contexto para implementar características, se ha de seguir esta pauta:
1.  **Drizzle Types**: Al pasar algo de Frontend al Backend siempre valida con el esquema inferido de `drizzle-zod` en `shared/schema.ts` (esquemas `insertXSchema`).
2.  **Modificaciones de UI**: Usar los componentes bases creados en `client/src/components/ui` si ya existen. Si hay listas, buscar reciclar o emular `DataTable.tsx` y `EntityForm.tsx`.
3.  **Migraciones**: Toda nueva tabla necesita obligatoriamente tener la columna `id` (uuid v4 de preferencia mapeado nativo gen_random_uuid()) e ir acoplada con `.extend({ companyId })` cuando corresponda separar la tenencia (Multi-tenancy).
4.  **Si se hacen cambios en las tablas**: Recuerda que el servidor Linux remoto necesitará lanzar internamente el comando de `drizzle-kit push` para verse reflejado, por lo que a la IA en el futuro se le debe avisar de *desplegar cambios en la estructura de DB en el remoto*.

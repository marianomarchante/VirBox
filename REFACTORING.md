# VirBox — Historial de Refactorización Backend

> **Fecha**: 14 de abril de 2026  
> **Objetivo**: Modularizar la arquitectura del backend para eliminar "God Files" y mejorar la mantenibilidad.

---

## 📁 Estructura nueva del proyecto

```
VirBox/
├── shared/
│   ├── schema.ts              ← Hub de re-exportación (compatibilidad)
│   └── schemas/               ← NUEVO — Esquemas por dominio
│       ├── auth.ts            ← Usuarios, sesiones, permisos
│       ├── core.ts            ← Empresas, categorías
│       ├── crm.ts             ← Clientes, proveedores
│       ├── inventory.ts       ← Inventario, movimientos
│       ├── billing.ts         ← Facturas, albaranes, recibos agrícolas, artículos
│       ├── documents.ts       ← Documentos adjuntos
│       └── events.ts          ← Eventos y notificaciones
│
├── server/
│   ├── index.ts               ← Punto de entrada (sin cambios estructurales)
│   ├── routes.ts              ← Hub de integración (~40 líneas, antes 1790)
│   ├── storage.ts             ← Fachada delegante (~265 líneas, antes 1040)
│   ├── middleware/            ← NUEVO — Middlewares centralizados
│   │   ├── auth.middleware.ts ← isAuthenticated, isAdmin, checkPermission()
│   │   └── error.middleware.ts← Global error handler (incluye Zod)
│   ├── routes/                ← NUEVO — Rutas por dominio
│   │   ├── auth.routes.ts     ← /api/auth/*
│   │   ├── admin.routes.ts    ← /api/admin/*
│   │   ├── companies.routes.ts← /api/companies/*
│   │   ├── crm.routes.ts      ← /api/clients, /api/suppliers
│   │   ├── billing.routes.ts  ← /api/transactions, /api/invoices, /api/delivery-notes, etc.
│   │   ├── inventory.routes.ts← /api/inventory/*
│   │   ├── core.routes.ts     ← /api/categories, /api/dashboard
│   │   ├── documents.routes.ts← /api/documents/*
│   │   └── events.routes.ts   ← /api/events/*
│   └── repositories/          ← NUEVO — Repositorios de acceso a datos
│       ├── auth.repository.ts ← Usuarios y permisos
│       ├── core.repository.ts ← Empresas y categorías
│       ├── crm.repository.ts  ← Clientes y proveedores
│       ├── inventory.repository.ts ← Inventario
│       ├── billing.repository.ts   ← Transacciones, facturas, recibos
│       └── media.repository.ts     ← Documentos y eventos
│
└── client/src/components/common/ ← NUEVO — Componentes genéricos de UI
    ├── DataTable.tsx          ← Tabla genérica con columnas y acciones CRUD
    └── EntityForm.tsx         ← Formulario de diálogo genérico (zod + react-hook-form)
```

---

## 🔄 Reducción de deuda técnica

| Fichero | Antes | Después | Cambio |
|---|---|---|---|
| `shared/schema.ts` | 654 líneas | ~10 líneas | Hub de re-exportación |
| `server/routes.ts` | 1790 líneas | ~40 líneas | Hub de integración |
| `server/storage.ts` | 1040 líneas | ~265 líneas | Fachada delegante |
| `client/.../Clients.tsx` | 508 líneas | ~310 líneas | Usa DataTable |
| `client/.../Suppliers.tsx` | 523 líneas | ~350 líneas | Usa DataTable + EntityForm |

---

## 🧱 Patrones y decisiones de diseño

### Middlewares
- `isAuthenticated` — verifica sesión activa (`req.user`)
- `isAdmin` — verifica `req.user.isAdmin === true`
- `checkPermission(role?)` — valida autenticación + acceso a `companyId` (del body o query). Si se pasa un `role`, también verifica el rol del usuario en la empresa.

### Repositorios
- `MemStorage` en `storage.ts` actúa como **fachada**: instancia los 6 repositorios y delega cada método al repositorio correspondiente.
- La transacción de creación en `createTransaction()` actualiza automáticamente los totales de cliente/proveedor (lógica de negocio coordinada en la fachada, no en el repositorio).

### Componentes Frontend
- `DataTable<T>` acepta un array de `columns` con `header`, `accessor` (clave o función renderizadora) y `align`.
- `EntityForm<T>` es un `Dialog` con `react-hook-form` integrado; recibe `schema` Zod y `defaultValues` y expone el objeto `form` vía render prop.

---

## 🗺️ Rutas API registradas

```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/user

GET    /api/admin/users
PATCH  /api/admin/users/:id/admin
GET    /api/admin/companies/:companyId/users
POST   /api/admin/companies/:companyId/users
DELETE /api/admin/companies/:companyId/users/:userId

GET    /api/companies
POST   /api/companies
PUT    /api/companies/:id
DELETE /api/companies/:id

GET    /api/clients
POST   /api/clients
PUT    /api/clients/:id
DELETE /api/clients/:id

GET    /api/suppliers
POST   /api/suppliers
PUT    /api/suppliers/:id
DELETE /api/suppliers/:id

GET    /api/transactions
POST   /api/transactions
PUT    /api/transactions/:id
DELETE /api/transactions/:id

GET    /api/articles
POST   /api/articles
PUT    /api/articles/:id
DELETE /api/articles/:id

GET    /api/invoices
POST   /api/invoices
PATCH  /api/invoices/:id/status
DELETE /api/invoices/:id

GET    /api/delivery-notes
POST   /api/delivery-notes
PUT    /api/delivery-notes/:id
DELETE /api/delivery-notes/:id

GET    /api/agricultural-receipts
POST   /api/agricultural-receipts
PUT    /api/agricultural-receipts/:id
DELETE /api/agricultural-receipts/:id

GET    /api/inventory
POST   /api/inventory
PUT    /api/inventory/:id
DELETE /api/inventory/:id
POST   /api/inventory/:id/movements

GET    /api/categories
POST   /api/categories
PUT    /api/categories/:id
DELETE /api/categories/:id

GET    /api/dashboard/metrics
GET    /api/dashboard/monthly-data

GET    /api/documents
POST   /api/documents
PUT    /api/documents/:id
DELETE /api/documents/:id

GET    /api/events
POST   /api/events
PATCH  /api/events/:id/read
DELETE /api/events/:id
```

---

## ✅ Estado de verificación

- **Build producción**: ✅ `vite build` — `✓ 3983 modules transformed, built in 9.55s`
- **Compatibilidad**: ✅ `shared/schema.ts` re-exporta todo, sin cambios en el frontend
- **Tipado**: ✅ Interfaces mantenidas via `IStorage` en `storage.ts`

---

## 🚀 Próximos pasos sugeridos

1. **Migración a Drizzle con base de datos real** — Reemplazar los repositorios `MemStorage` por implementaciones con Drizzle ORM y PostgreSQL (Neon ya está configurado en las dependencias).
2. **Code splitting** — El bundle principal pesa 1.8 MB. Usar `React.lazy()` en las rutas del frontend.
3. **Tests de integración** — Agregar tests para los middlewares y rutas principales.
4. **Separar `IStorage` en interfaces por dominio** — `IAuthStorage`, `IBillingStorage`, etc. para mayor cohesión.

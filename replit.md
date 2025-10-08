# MiContable - Business Management System

## Overview

MiContable is a comprehensive business management application designed to track financial transactions, manage inventory, maintain client and supplier relationships, and generate reports for organizations, businesses, and associations. It provides a complete solution for monitoring income, expenses, stock levels, and business metrics through an intuitive dashboard. The project aims to deliver a robust, scalable, and user-friendly platform that streamlines business operations and offers valuable insights.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React 18 and TypeScript, using Vite for fast development and optimized builds. Wouter handles client-side routing, while Shadcn/ui (based on Radix UI) provides accessible and customizable UI components, styled with Tailwind CSS. State management for server data is handled by TanStack Query, and forms are managed with React Hook Form, validated by Zod. Data visualization is powered by Recharts. The design system uses professional blue/green primary colors, complementary secondary tones, consistent typography (Inter font), dark mode support, and a responsive, mobile-first approach. A "No Company Selected" pattern ensures informative messages prevent blank screens, and HTTP 304 responses are handled to prevent blank pages on repeat navigation by allowing React Query to retain cached data.

### Backend Architecture

The backend uses Node.js with Express.js and TypeScript. Drizzle ORM provides type-safe database interactions with PostgreSQL (hosted on Neon serverless). Zod schemas are shared for validation. The API is RESTful, with endpoints for transactions, inventory, product categories, clients, suppliers, and dashboard metrics. It uses JSON for requests/responses, centralized error handling, and request logging. Development uses Vite with HMR, while production serves static assets.

### Authentication & Authorization System

Authentication is handled via Replit Auth (OpenID Connect / OAuth 2.0) using Passport.js and a PostgreSQL session store with secure, httpOnly cookies. Frontend authentication uses a React Query-based state management, protecting routes and providing logout functionality.

Authorization uses a role-based access control (RBAC) system:
- **Global Admin Role:** Defined by an `isAdmin` flag, providing full system access and user management.
- **Company-Level Permissions:** Stored in `userCompanyPermissions`, granting 'consulta' (read-only) or 'administración' (full access) roles per company.
Permissions are enforced on both the backend (middleware for `isAuthenticated`, `isAdmin`, and `checkPermission`) and frontend (via `useCompanyPermission` hook to conditionally disable UI elements). The `CompanyContext` ensures data isolation and dynamic UI updates when switching companies, instantly refreshing all relevant data.

### Data Storage

The system supports multi-company data isolation, where every data table includes a `companyId` field, and all operations enforce companyId verification. The PostgreSQL database schema includes:
- **Authentication & Authorization:** `Sessions`, `Users` (with `isAdmin` flag), `UserCompanyPermissions` (linking users to companies with roles), and `Companies` tables.
- **Business Data:** `Transactions`, `Inventory`, `ProductCategories` (company-specific), `Clients`, `Suppliers`, and `InventoryMovements` tables.
Data relationships are defined, and soft deletion is supported via status flags. A cascade delete mechanism, implemented at the application level with database transactions, ensures complete removal of all related data when a company is deleted, guaranteeing data integrity. Shared Zod schemas and Drizzle-zod integration provide type safety.

## External Dependencies

- **Database:** Neon Serverless PostgreSQL (`@neondatabase/serverless`), Drizzle Kit for migrations.
- **UI Components:** Radix UI (headless primitives), Shadcn/ui (component library), Recharts (charts).
- **Development Tools:** Replit Integration (Cartographer, Dev banner), TSX, ESBuild.
- **Validation & Forms:** Zod, `@hookform/resolvers`.
- **Utility Libraries:** date-fns, clsx, tailwind-merge, nanoid, cmdk.
- **Session Management:** connect-pg-simple (PostgreSQL session store).
- **Build & Styling:** Vite, PostCSS, Autoprefixer, Tailwind CSS.
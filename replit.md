# MiContable - Business Management System

## Overview

MiContable is a comprehensive business management application designed to track financial transactions, manage inventory, maintain client and supplier relationships, and generate reports. It aims to provide a robust, scalable, and user-friendly platform for organizations, businesses, and associations, streamlining operations and offering valuable insights through an intuitive dashboard.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

Built with React 18 and TypeScript, using Vite, Wouter for routing, and Shadcn/ui (Radix UI, Tailwind CSS) for components. TanStack Query manages server data, React Hook Form handles forms with Zod validation, and Recharts is used for data visualization. The design emphasizes a professional blue/green color scheme, consistent typography, dark mode, and mobile-first responsiveness. A "No Company Selected" pattern and HTTP 304 handling prevent blank screens.

### Backend

Developed with Node.js, Express.js, and TypeScript. Drizzle ORM provides type-safe interactions with PostgreSQL (Neon serverless). Zod schemas are shared for validation. The API is RESTful, offering endpoints for core business functions, with centralized error handling and request logging. ETag generation is disabled, and aggressive no-cache headers are used to ensure fresh data. File upload limits are set at 10 MB for PDFs and images.

### Authentication & Authorization

Authentication uses Replit Auth (OpenID Connect / OAuth 2.0) via Passport.js and a PostgreSQL session store. Authorization is role-based (RBAC) with a global `isAdmin` flag and company-level 'consulta' (read-only) or 'administración' (full access) permissions, enforced on both backend and frontend. `CompanyContext` ensures data isolation.

### Data Storage

Supports multi-company data isolation with `companyId` in all tables. The PostgreSQL schema includes tables for authentication (`Sessions`, `Users`, `UserCompanyPermissions`, `Companies`) and business data (`Transactions`, `Inventory`, `ProductCategories`, `DocumentCategories`, `Documents`, `Clients`, `Suppliers`, `InventoryMovements`). Soft deletion is supported, and application-level cascade deletion maintains integrity.

### Key Modules & Features

*   **PDF Document Management:** Transactions support PDF attachments (stored as base64), viewable and downloadable via a dedicated viewer.
*   **Document Categories:** Organize documents with company-scoped categories, providing CRUD operations and search/filtering.
*   **Document Search and Filtering:** Comprehensive filtering by text, category, and date range with dynamic result counts.
*   **Transaction Filtering:** Income and Expenses pages feature filtering by text, category, and date range, optimized for backend integration.
*   **Inventory Module:** Tracks valuable objects with attributes like name, category, location, value, acquisition date, and supports PDF/image attachments. Includes robust filtering by text and category.
*   **Reports Date Range Filtering:** Flexible time-based filtering (Month, Quarter, Year, Custom Range) with dynamic chart aggregation (daily/weekly) and PDF export.
*   **Events Module:** Manages company events with CRUD operations, date tracking, and search functionality.
*   **Interactive Help System:** A comprehensive, tabbed help system accessible from all pages, providing detailed documentation for all modules in Spanish.

## External Dependencies

*   **Database:** Neon Serverless PostgreSQL, Drizzle Kit.
*   **UI Components:** Radix UI, Shadcn/ui, Recharts.
*   **Development Tools:** Replit Integration, TSX, ESBuild.
*   **Validation & Forms:** Zod, `@hookform/resolvers`.
*   **Utility Libraries:** date-fns, clsx, tailwind-merge, nanoid, cmdk.
*   **Session Management:** connect-pg-simple.
*   **Build & Styling:** Vite, PostCSS, Autoprefixer, Tailwind CSS.
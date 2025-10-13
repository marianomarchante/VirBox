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
- **Business Data:** `Transactions`, `Inventory`, `ProductCategories` (company-specific), `DocumentCategories` (company-specific), `Documents`, `Clients`, `Suppliers`, and `InventoryMovements` tables.
Data relationships are defined, and soft deletion is supported via status flags. A cascade delete mechanism, implemented at the application level with database transactions, ensures complete removal of all related data when a company is deleted, guaranteeing data integrity. Shared Zod schemas and Drizzle-zod integration provide type safety.

### PDF Document Management

Transactions (income and expenses) support PDF document attachments for record-keeping and compliance:
- **Storage:** PDFs are stored as base64-encoded data URLs in the `pdfDocument` field, with original filenames in `pdfFileName`
- **Upload:** Users can attach PDF files when creating or editing transactions via the TransactionModal component
- **Visualization:** A dedicated PdfViewer component displays attached PDFs in a modal with download capability
- **UI Integration:** Income and Expenses tables show a FileText icon (blue) for transactions with PDFs, allowing instant viewing

### Document Categories

Document categories provide a way to organize and classify documents within the document management system:
- **Database Schema:** `DocumentCategories` table with company-scoped categories (id, name, description, companyId, isActive, createdAt)
- **Document Association:** `Documents` table includes optional `categoryId` field for category assignment
- **API Endpoints:** Full CRUD operations at `/api/document-categories` with company-level authorization and Zod validation
- **Frontend Components:** 
  - Dedicated DocumentCategories page at `/document-categories` for category management
  - Category selector integrated into document creation/editing forms
  - useDocumentCategories hook following established patterns for category management
- **Security:** All operations require company permissions (admin for create/update/delete, consulta for read)
- **Navigation:** Accessible via sidebar and mobile menu under Documents section

### Document Search and Filtering

The document management system includes a comprehensive filtering system for efficient document retrieval:
- **Search Filter:** Text search across document titles and descriptions (case-insensitive, trimmed for accuracy)
- **Category Filter:** Filter by specific category, all categories, or documents without a category
- **Date Range Filter:** Filter documents by creation date (from/to date pickers with inclusive range)
- **UI/UX Features:**
  - Responsive filter panel with grid layout (4 columns on desktop, stacked on mobile)
  - Real-time filtering using React useMemo for optimal performance
  - Clear filters button (conditionally shown when filters are active)
  - Dynamic result count showing "X de Y documentos"
  - Contextual empty state messages (different for filtered vs. no documents)
- **Implementation:** Frontend-based filtering using useMemo to derive filteredDocuments from cached query data

### Transaction Filtering (Income & Expenses)

Both Income and Expenses pages include comprehensive filtering capabilities for efficient transaction retrieval:
- **Search Filter:** Text search across transaction concepts and notes (case-insensitive, trimmed for accuracy)
- **Category Filter:** Filter by specific transaction category using useCategories hook (type='income' or 'expense')
- **Date Range Filter:** Filter transactions by date (from/to date pickers with inclusive range)
- **UI/UX Features:**
  - Responsive filter panel matching DocumentManagement pattern (4 columns on desktop, stacked on mobile)
  - Real-time filtering integrated with useTransactions hook for backend optimization
  - Clear filters button (conditionally shown when filters are active)
  - Dynamic transaction count display
- **Implementation:** Backend filtering through useTransactions hook with filter parameters (search, category, dateFrom, dateTo)
- **Test Coverage:** All filter inputs and clear filters button include data-testid attributes for e2e testing

### Inventory Module (Objects Management)

The Inventory module tracks valuable objects and assets owned by the organization:
- **Database Schema:** `Inventory` table with fields: id, name, categoryId, value (euros), acquisitionDate, pdfDocument, pdfFileName, imageDocument, imageFileName, companyId, createdAt, updatedAt
- **Object Tracking:** Each inventory item represents a physical or digital asset with monetary value and acquisition date
- **Document Support:** Objects can have attached PDF documents (receipts, invoices, certificates) and images stored as base64 with original filenames
- **Filtering Capabilities:**
  - **Search Filter:** Text search by object name (case-insensitive, trimmed for accuracy, null-safe using optional chaining)
  - **Category Filter:** Filter by specific product category, all categories, or objects without a category
  - **UI/UX Features:**
    - Responsive filter panel with 2-column grid layout (stacked on mobile)
    - Real-time filtering using React useMemo for optimal performance
    - Clear filters button (conditionally shown when filters are active)
    - Dynamic object count showing "X de Y objetos"
    - Contextual empty state messages (different for filtered vs. no objects)
- **Display:** Table shows object name, category, value (€), acquisition date, and document indicators (blue FileText icon for PDFs, green Image icon for images)
- **Visualization:** PdfViewer component for PDF documents with download capability, Dialog component for image viewing
- **Implementation:** Frontend-based filtering using useMemo to derive filteredInventory from cached query data with null-safe operators
- **Test Coverage:** All filter inputs, clear filters button, and PDF viewing include data-testid attributes for e2e testing

### Reports Date Range Filtering

The reports module supports flexible time-based filtering with multiple period options:
- **Period Types:** Month, Quarter, Year, All Years, and Custom Date Range
- **Custom Date Range:** 
  - Two DatePicker components for "From" and "To" dates with Spanish locale
  - "To" date automatically constrained to be >= "From" date
  - Clear dates button for easy reset
  - Inclusive date filtering (start of "from" date to end of "to" date)
- **Chart Adaptation:** 
  - Daily view for ranges ≤ 90 days
  - Weekly aggregation for ranges > 90 days (optimized performance)
- **PDF Export:** Automatically includes custom date range in report header and filename
- **UI/UX:** DatePickers use shadcn Calendar component with Popover for clean, accessible interface

### Interactive Help System

The application includes a comprehensive built-in help system accessible from every page:
- **Location:** Help button in the TopBar (top-right corner, next to company selector)
- **Structure:** Dialog-based interface with tabbed navigation for organized content
- **Content Sections:**
  - **Inicio (Overview):** Introduction, multi-company system explanation, quick start guide
  - **Módulos:** Detailed documentation for all main modules (Dashboard, Transactions, Inventory, Clients, Suppliers, Documents)
  - **Informes:** Complete guide for Reports module including filters, date ranges, and PDF export
  - **Admin:** Administrative functions for user management, company management, and system configuration
- **Features:**
  - Organized with Tabs component for easy navigation
  - ScrollArea for comfortable reading of extensive content
  - Visual icons for each section and feature
  - Non-technical language suitable for all users
  - Fully in Spanish for accessibility
- **Implementation:** 
  - Help component (`client/src/components/shared/Help.tsx`)
  - Integrated in TopBar for universal access
  - Uses shadcn Dialog, Tabs, and ScrollArea components
- **UI/UX:** Clean modal interface with HelpCircle icon, responsive layout, and clear visual hierarchy

## External Dependencies

- **Database:** Neon Serverless PostgreSQL (`@neondatabase/serverless`), Drizzle Kit for migrations.
- **UI Components:** Radix UI (headless primitives), Shadcn/ui (component library), Recharts (charts).
- **Development Tools:** Replit Integration (Cartographer, Dev banner), TSX, ESBuild.
- **Validation & Forms:** Zod, `@hookform/resolvers`.
- **Utility Libraries:** date-fns, clsx, tailwind-merge, nanoid, cmdk.
- **Session Management:** connect-pg-simple (PostgreSQL session store).
- **Build & Styling:** Vite, PostCSS, Autoprefixer, Tailwind CSS.
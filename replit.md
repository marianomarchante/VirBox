# MiContable - Business Management System

## Overview

MiContable is a comprehensive business management application designed to help organizations, businesses, and associations track their financial transactions, manage inventory, maintain client and supplier relationships, and generate reports. The system provides a complete solution for monitoring income, expenses, stock levels, and business metrics through an intuitive dashboard interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization

**Design System:**
The application uses a professional business-themed design system:
- Primary colors based on professional blue/green shades
- Secondary colors using complementary tones
- Consistent spacing and typography using the Inter font family
- Dark mode support through CSS variable theming
- Responsive design with mobile-first approach

**Component Architecture:**
- Reusable UI components in `/client/src/components/ui`
- Feature-specific components organized by domain (dashboard, forms, layout)
- Page components for each route in `/client/src/pages`
- Custom hooks for data fetching and business logic in `/client/src/hooks`

### Backend Architecture

**Technology Stack:**
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon serverless)
- **Validation**: Zod schemas shared between frontend and backend

**API Design:**
RESTful API architecture with the following resource endpoints:
- `/api/transactions` - Financial transactions (income/expenses)
- `/api/inventory` - Product inventory management
- `/api/clients` - Client relationship management
- `/api/suppliers` - Supplier management
- `/api/dashboard` - Aggregated metrics and analytics

**Request/Response Flow:**
- JSON-based request/response format
- Centralized error handling and validation
- Request logging middleware for API endpoints
- Query parameter-based filtering for transactions

**Development vs Production:**
- Development: Vite dev server with HMR middleware integration
- Production: Static file serving from built assets
- Environment-aware configuration through NODE_ENV

### Authentication & Authorization System

**Authentication Implementation:**

The application uses **Replit Auth** (OpenID Connect / OAuth 2.0) for user authentication:

1. **Backend Authentication (server/replitAuth.ts):**
   - Passport.js integration with OpenID Client strategy
   - Session management using PostgreSQL session store (connect-pg-simple)
   - Automatic token refresh for expired sessions
   - Session TTL: 7 days with secure, httpOnly cookies

2. **Authentication Endpoints:**
   - `GET /api/login` - Initiates Replit OIDC flow with consent prompt
   - `GET /api/callback` - OIDC callback that creates/updates user session
   - `GET /api/logout` - Terminates session and redirects to OIDC end-session URL
   - `GET /api/auth/user` - Returns currently authenticated user profile

3. **Frontend Authentication (client/src/hooks/use-auth.tsx):**
   - React Query-based authentication state management
   - Automatic cache invalidation on logout
   - Landing page for non-authenticated users
   - Protected routes require authentication

4. **User Profile Management:**
   - Users automatically created/updated on first login via OIDC claims
   - Profile includes: id, email, firstName, lastName, profileImageUrl
   - Admin flag stored in database (users.isAdmin)

**Authorization & Permission System:**

The application implements a **role-based access control (RBAC)** system with two levels:

1. **Global Admin Role:**
   - Set via `users.isAdmin` database field
   - Bypasses all company-level permission checks
   - Exclusive access to User Management page (/usuarios)
   - Can manage all users, companies, and permissions across the system
   - Can create/edit/delete companies

2. **Company-Level Permissions:**
   - Stored in `userCompanyPermissions` table
   - Two roles per company:
     - **'consulta'** (read-only): Can view all company data but cannot create, edit, or delete
     - **'administración'** (full access): Can view and modify all company data

3. **Permission Verification:**

   **Backend (server/routes.ts):**
   - `isAuthenticated` middleware: Validates session and refreshes expired tokens
   - `isAdmin` middleware: Verifies global admin status
   - `checkPermission()` helper: Validates company-level permissions for specific operations
   - All GET routes: Require any permission (consulta or administración)
   - All mutations (POST/PUT/DELETE): Require 'administración' role

   **Frontend (client/src/hooks/use-company-permission.tsx):**
   - `useCompanyPermission` hook queries user permissions for current company
   - Returns: `{ canRead, canWrite, isAdmin, role, isLoading }`
   - Write operations conditionally disabled when `canWrite=false`
   - Applied to all pages: Dashboard, Income, Expenses, Inventory, Clients, Suppliers, Categories, Documents

4. **Company Access Filtering & Dynamic UI Updates:**
   - `CompanyContext` automatically filters companies based on user permissions
   - Users only see companies they have been granted access to
   - Switching companies triggers:
     - Permission re-validation
     - Automatic query invalidation and data refresh for all dashboard metrics, transactions, inventory, clients, and suppliers
     - UI update to display the selected company name in Sidebar and MobileMenu (replaces "MiContable" placeholder)
   - All data views (Dashboard, Income, Expenses, etc.) instantly reflect the selected company's data

**Security Notes:**
- ✅ All API routes protected by `isAuthenticated` middleware
- ✅ Company data isolated by userId + companyId permission checks
- ✅ Write operations verified at both UI and API levels
- ✅ Session cookies secured with httpOnly, secure flags
- ✅ Automatic token refresh prevents session expiration during active use
- ✅ Proper cache invalidation on authentication state changes

### Data Storage

**Multi-Company Data Isolation:**

The application supports multiple companies with complete data isolation:
- All data tables include a `companyId` field to segregate data by company
- Storage layer enforces companyId verification on all GET, UPDATE, and DELETE operations
- API layer automatically injects the companyId for all CREATE operations
- Each company can only access its own data (transactions, inventory, clients, suppliers, categories, documents)
- **Permission-based access**: Users can only access companies they have explicit permissions for

**Database Schema:**

The application uses PostgreSQL with the following core tables:

**Authentication & Authorization Tables:**

1. **Sessions Table**
   - Stores Passport.js session data for Replit Auth
   - Fields: sid (session ID), sess (session data), expire (expiration timestamp)
   - Managed automatically by connect-pg-simple

2. **Users Table**
   - Stores user profiles from Replit Auth
   - Fields: id, email, firstName, lastName, profileImageUrl, isAdmin
   - Auto-created/updated on login via OIDC claims
   - isAdmin flag grants global administrator privileges

3. **User Company Permissions Table**
   - Maps users to companies with specific roles
   - Fields: id, userId, companyId, role ('consulta' | 'administración')
   - Unique constraint on (userId, companyId) pair
   - Defines what users can access and their permission level

4. **Companies Table**
   - Stores company/organization information
   - Fields: id, name, taxId, address, phone, email, isActive
   - Each company has isolated data and user access controls

**Business Data Tables:**

1. **Transactions Table**
   - Tracks all financial movements (income and expenses)
   - Includes type, date, concept, category, amount, quantity
   - Links to clients/suppliers via foreign key relationship
   - Supports filtering by date range, type, category, and search

2. **Inventory Table**
   - Manages products and materials
   - Tracks current stock levels with units of measurement
   - Minimum stock thresholds for alerts
   - Price per unit tracking
   - Categorized by product type

3. **Clients Table**
   - Customer relationship management
   - Contact information (email, phone, address)
   - Purchase history tracking (total purchases, order count)
   - Active/inactive status flag

4. **Suppliers Table**
   - Vendor management
   - Contact details and categorization
   - Total purchases and payment tracking
   - Category classification

5. **Inventory Movements Table**
   - Tracks stock changes over time
   - Links to transactions and inventory items
   - Records movement type (in/out) and quantities

**Data Relationships:**
- Transactions reference clients or suppliers (one-to-many)
- Inventory movements link to both inventory items and transactions (many-to-one)
- Soft delete support through status flags

**Type Safety:**
- Shared schema definitions in `/shared/schema.ts`
- Drizzle-zod integration for runtime validation
- TypeScript types derived from database schema

### External Dependencies

**Database Services:**
- **Neon Serverless PostgreSQL**: Primary database provider
- Connection via `@neondatabase/serverless` driver
- Database migrations managed through Drizzle Kit

**UI Component Libraries:**
- **Radix UI**: Headless UI primitives for accessibility
  - Dialog, Dropdown, Select, Toast, and 20+ other components
  - Built-in accessibility features (ARIA, keyboard navigation)
- **Shadcn/ui**: Pre-built component collection based on Radix
- **Recharts**: Chart and data visualization library

**Development Tools:**
- **Replit Integration**: Development environment plugins
  - Cartographer for code navigation
  - Dev banner for development mode indication
  - Runtime error overlay for debugging
- **TSX**: TypeScript execution for development server
- **ESBuild**: Production bundling for server code

**Validation & Forms:**
- **Zod**: Schema validation library
- **@hookform/resolvers**: React Hook Form + Zod integration

**Utility Libraries:**
- **date-fns**: Date manipulation and formatting
- **clsx + tailwind-merge**: Conditional CSS class handling
- **nanoid**: Unique ID generation
- **cmdk**: Command palette component

**Session Management:**
- **connect-pg-simple**: PostgreSQL session store (configured but may not be actively used)

**Build & Development:**
- **Vite**: Frontend build tool and dev server
- **PostCSS + Autoprefixer**: CSS processing
- **Tailwind CSS**: Utility-first styling
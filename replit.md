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

### Data Storage

**Database Schema:**

The application uses PostgreSQL with the following core tables:

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
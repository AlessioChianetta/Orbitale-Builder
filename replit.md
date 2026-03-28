# Overview

This is a professional Italian business website built as a full-stack application with a comprehensive CMS system, dynamic landing page builder, and integrated blog functionality. The application serves as a complete digital marketing platform inspired by HubSpot and Webflow, designed specifically for professional Italian businesses with a focus on lead generation and conversion optimization.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development practices
- **Routing**: Wouter for lightweight client-side routing without the complexity of React Router
- **UI Framework**: Shadcn/UI component library built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with custom design system following Italian professional business aesthetics
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Form Handling**: React Hook Form with Zod validation for type-safe form validation
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API development
- **Language**: TypeScript throughout the entire stack for consistency and type safety
- **Database ORM**: Drizzle ORM for type-safe database operations and migrations
- **Authentication**: JWT-based authentication with bcrypt for password hashing
- **File Uploads**: Multer middleware for handling media uploads with file type validation
- **API Design**: RESTful endpoints with consistent error handling and response formatting

## Data Storage Solutions
- **Primary Database**: PostgreSQL configured for production use with Neon Database
- **ORM**: Drizzle ORM with schema-first approach providing full TypeScript integration
- **Migration System**: Drizzle Kit for database schema versioning and deployment
- **File Storage**: Local file system with plans for cloud storage integration

## Database Schema Design
- **Users**: Admin and editor roles with secure authentication
- **Pages**: Dynamic page management with SEO metadata and publishing workflow
- **Blog Posts**: Full-featured blog system with categories, tags, and relationships
- **Landing Pages**: Template-based landing page system with JSON-stored configuration
- **Leads & Candidates**: Lead generation and candidate management system
- **Media**: File upload and management system
- **Analytics**: Event tracking for user behavior and conversion metrics

## Authentication & Authorization
- **JWT Tokens**: Stateless authentication with 7-day expiration, JWT_SECRET required as env var (no fallback)
- **Role-Based Access**: Admin and editor roles with different permission levels
- **Middleware Protection**: Route-level authentication for admin endpoints
- **Password Security**: bcrypt hashing with salt rounds for secure password storage
- **Registration**: Admin-only (requires authenticated admin to create new users)
- **Tenant Isolation**: All data queries enforce tenantId filtering; marketing leads, stats, clients all scoped to authenticated user's tenant
- **Public Routes**: When content is not found for unauthenticated users, redirect to login page instead of showing 404

## External Dependencies

- **@neondatabase/serverless**: PostgreSQL database hosting and serverless connection pooling
- **@radix-ui/react-***: Comprehensive set of unstyled, accessible UI primitives
- **@tanstack/react-query**: Server state management, caching, and synchronization
- **@hookform/resolvers**: Integration between React Hook Form and validation libraries
- **drizzle-orm**: Type-safe PostgreSQL ORM with schema migrations
- **drizzle-kit**: Database migration and schema management tooling
- **bcryptjs**: Password hashing and security utilities
- **jsonwebtoken**: JWT token generation and verification
- **multer**: File upload handling middleware
- **react-quill**: Rich text editor for content management
- **react-helmet**: HTML head management for SEO optimization
- **wouter**: Lightweight routing library for React applications
- **zod**: TypeScript-first schema validation library
- **lucide-react**: Icon library with consistent design language
- **tailwindcss**: Utility-first CSS framework
- **vite**: Build tool and development server
- **class-variance-authority**: Utility for creating variant-based component APIs
- **clsx & tailwind-merge**: Class name manipulation utilities

## Admin Dashboard Architecture
- **Sidebar Navigation**: Grouped into 3 sections (Principale, Gestione, Strumenti) with indigo/slate design theme
- **Panoramica sub-tabs**: Overview stats, Blog, Servizi, Progetti, Page Builder, Navbar
- **Impostazioni SEO sub-tabs**: SEO, Impostazioni, Footer
- **Lead sub-tabs**: Lead, Marketing Leads, Landing Pages
- **PageEditor**: Uses early-return pattern — when isEditingPage is true, replaces entire dashboard with full-screen PageEditor
- **Design System**: Indigo-600 accents, slate palette backgrounds, border-0 shadow-sm cards, white/80 backdrop-blur header
- **Login Form**: Modern centered design with Lock icon, no credential hints shown
- **SuperAdmin Dashboard**: Separate modernized dashboard at /superadmin with tenant/user management, impersonation, password reset

## Content Management System
- **Rich Text Editor**: React Quill integration for WYSIWYG content editing
- **Template System**: JSON-based landing page templates with editable sections
- **SEO Management**: Built-in meta tag management and sitemap generation
- **Media Management**: File upload system with image optimization capabilities
- **Publishing Workflow**: Draft, published, and scheduled status management

## Lead Generation Features
- **Dynamic Forms**: Customizable contact and candidate application forms
- **Template-Based Landing Pages**: Pre-built templates for quick deployment
- **Conversion Tracking**: Analytics system for measuring form submissions and user engagement
- **Admin Dashboard**: Comprehensive management interface for all system components

## Facebook Pixel Analytics Integration
- **Multi-Tenant Facebook Pixel**: Each tenant can configure their own Facebook Pixel ID in SEO settings
- **Route-Based Event Tracking**: Configure custom Facebook Pixel events for each route in Analytics Dashboard
- **Automatic Event Triggering**: Custom hook `useFacebookPixelTracking` automatically fires configured events
- **Idempotency Guarantee**: Events fire exactly once per page view, even in React Strict Mode
- **Hardcoded Routes Support**: Static routes (/orbitale, /thank-you, /candidatura, etc.) appear in Analytics Dashboard
- **Cross-Tenant Routing**: Authenticated users' events use their tenant configuration, not the domain's tenant
- **Event Configuration**: Configure event name, custom data, and activation status per route in admin panel
- **Comprehensive Logging**: Detailed console logging for debugging event tracking and tenant routing

## AI / Gemini Configuration
- **Table**: `superadmin_gemini_config` — created via direct SQL (see `sql/superadmin_gemini_config.sql`)
- **Note**: All DB schema changes in this project use direct SQL, NOT Drizzle push/migrations
- **Encryption**: API keys stored AES-256-CBC encrypted using a key derived from `DATABASE_URL` via SHA-256 (`server/encryption.ts`)
- **Routes**: GET/POST/DELETE `/api/superadmin/gemini-config` — superadmin-only protected
- **POST behavior**: If config already exists, can update `enabled` alone without re-submitting keys. New keys optional.
- **UI**: "Configurazione AI" tab in SuperAdminDashboard — shows key preview, count, enable/disable toggle, key input form

## API Keys System
- **External API Authentication**: Secure API key authentication for third-party integrations
- **Key Generation**: 41-character API keys with environment prefixes (crm_live_ or crm_test_)
- **Scope-Based Authorization**: Fine-grained access control with scopes (marketing_leads:read, marketing_leads:write, etc.)
- **Multi-Tenant Isolation**: Complete data isolation between tenants enforced at query level
- **Authentication Methods**: Supports both X-API-Key header and Authorization: Bearer token
- **Key Management**: Full lifecycle management with revocation and last-used tracking

## External Marketing Leads API
- **GET /api/external/marketing-leads**: List all marketing leads with pagination and filtering
- **GET /api/external/marketing-leads/:id**: Get single lead by ID with tenant isolation
- **GET /api/external/marketing-leads/stats**: Aggregate statistics with breakdowns by source, campaign, and daily trends
- **CSV Export**: Support for CSV export format via Accept header
- **Filters**: Support for date range (days), source, campaign, status, and field selection
- **Security**: All endpoints protected by API key authentication and scope validation
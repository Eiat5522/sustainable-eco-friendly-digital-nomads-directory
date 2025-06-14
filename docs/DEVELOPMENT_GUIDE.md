# 🚀 Development Guide

This guide provides comprehensive information for developers working on the Sustainable Eco-Friendly Digital Nomads Directory project.

## 📋 Project Overview

### Architecture

This is a **monorepo** containing a Next.js application with Sanity CMS backend, designed for sustainable travel and digital nomad lifestyle content.

### Tech Stack Summary

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend**: Sanity CMS, MongoDB Atlas, NextAuth.js
- **Testing**: Playwright (120+ E2E tests)
- **Deployment**: Vercel (frontend), Sanity (CMS hosting)

## 🏗️ Monorepo Structure

```text
sustainable-eco-friendly-digital-nomads-directory/
├── app-next-directory/          # Main Next.js application
│   ├── src/                     # Source code
│   ├── tests/                   # Playwright test suites
│   ├── public/                  # Static assets
│   └── docs/                    # Component documentation
├── sanity/                      # Sanity CMS configuration
│   ├── schemas/                 # Content type definitions
│   └── sanity.config.ts         # Studio configuration
├── listings/                    # Data processing & migration
│   ├── *.py                     # Python migration scripts
│   └── *.json                   # Data files
├── docs/                        # Project documentation
├── docs/                        # Project documentation
├── memory-bank/                 # Context, logs, and session files (six key context files retained)
└── tasks/                       # Task management files
```

## 🔧 Development Setup

### Prerequisites

- **Node.js**: 18.17.0 or later
- **npm**: 9.6.7 or later
- **Python**: 3.8+ (for data migration scripts)
- **Git**: Latest version

### Initial Setup

1. **Clone and install:**

   ```bash
   git clone <repository-url>
   cd sustainable-eco-friendly-digital-nomads-directory
   npm install
   ```

2. **Install workspace dependencies:**

   ```bash
   # Install Next.js dependencies
   cd app-next-directory && npm install

   # Install Sanity dependencies
   cd ../sanity && npm install
   ```

3. **Environment configuration:**
   Create `.env.local` files in both `app-next-directory/` and `sanity/`:

   **app-next-directory/.env.local:**

   ```env
   # Sanity Configuration
   NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
   NEXT_PUBLIC_SANITY_DATASET=production
   SANITY_API_TOKEN=your_api_token

   # MongoDB Configuration
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

   # NextAuth Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_32_character_secret

   # Optional: OAuth Providers
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

## 🚀 Development Workflow

### Starting Development Servers

```bash
# From project root
npm run dev          # Starts Next.js on :3000
npm run dev:sanity   # Starts Sanity Studio on :3333

# Or individually
cd app-next-directory && npm run dev
cd sanity && npm run dev
```

### Available Scripts

#### Root Level Scripts

```bash
npm run dev           # Start Next.js development server
npm run dev:sanity    # Start Sanity Studio
npm run build         # Build both Next.js and Sanity
npm run lint          # Lint Next.js application
```

#### Next.js App Scripts (from app-next-directory/)

```bash
npm run dev           # Development server
npm run build         # Production build
npm run start         # Production server
npm run lint          # ESLint check
npm run format        # Prettier formatting
npm run test          # Run Playwright tests
npm run test:ui       # Run tests with UI
npm run test:auth     # Run authentication tests only
```

#### Sanity Scripts (from sanity/)

```bash
npm run dev           # Development studio
npm run build         # Build studio
npm run deploy        # Deploy to Sanity hosting
```

## 🧪 Testing Strategy

### Test Coverage

- **120+ Playwright test cases** covering authentication flows
- **Cross-browser testing** (Chromium, Firefox, WebKit)
- **Role-based access control** validation
- **API endpoint security** testing
- **Mobile responsiveness** testing

### Running Tests

```bash
# From app-next-directory/
npm run test                    # All tests
npm run test:auth              # Authentication tests only
npm run test:ui                # Interactive test runner
npm run test:headed            # Tests with browser UI
npm run test:debug             # Debug mode
```

### Test Structure

```text
tests/
├── auth.spec.ts               # Authentication flow tests
├── rbac.spec.ts               # Role-based access control
├── auth-api.spec.ts           # API security tests
├── auth.setup.ts              # Test setup and authentication
└── utils/                     # Test utilities and helpers
```

## 📁 Code Organization

### Component Structure

```text
src/components/
├── auth/                      # Authentication components
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   └── AuthProvider.tsx
├── listings/                  # Listing-related components
│   ├── ListingCard.tsx        # Card display for listings
│   ├── ListingDetail.tsx      # Component for displaying full listing details
│   ├── ImageGallery.tsx       # Interactive image gallery for listings
│   └── ListingFilters.tsx
├── city/                      # City-related components (if any, e.g. CityCard.tsx)
├── common/                    # Shared components
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── Layout.tsx
└── ui/                        # Base UI components (Radix)
    ├── Button.tsx
    ├── Input.tsx
    └── Modal.tsx
```

### API Route Organization

```text
src/app/api/
├── auth/                      # NextAuth routes
│   └── [...nextauth]/
├── listings/                  # Listing management
│   ├── route.ts               # GET/POST listings (general listing operations)
│   └── [slug]/route.ts        # GET single listing data (Note: the page is at `app/listings/[slug]/page.tsx`)
├── city/
│   └── [slug]/route.ts        # GET single city data (Note: the page is at `app/city/[slug]/page.tsx`)
├── user/                      # User management
│   ├── profile/
│   └── favorites/
└── admin/                     # Admin endpoints
    └── moderation/
```

## 🔐 Authentication System

### Implementation Status: ✅ COMPLETED

The authentication system is fully implemented with:

- **NextAuth.js** with JWT strategy
- **MongoDB session storage**
- **Role-based access control** (5 levels)
- **Secure password hashing** with bcryptjs
- **Comprehensive testing** (120+ test cases)

### User Roles

1. **user**: Basic user access
2. **editor**: Content editing permissions
3. **venueOwner**: Venue management access
4. **admin**: Administrative access
5. **superAdmin**: Full system access

## 📊 Data Management

### Sanity CMS

- **Content types**: Listings, Cities, Blog Posts, Site Config
- **Schema definitions** in `sanity/schemas/`
- **Content migration** via Python scripts in `listings/`

### MongoDB

- **User authentication** data
- **Session management**
- **User preferences** and favorites

## 🚀 Deployment

### Development Environment

- **Next.js**: `http://localhost:3000`
- **Sanity Studio**: `http://localhost:3333`

### Production Deployment

- **Vercel** for Next.js application
- **Sanity Cloud** for CMS hosting
- **MongoDB Atlas** for database

## 🔄 Git Workflow

### Branch Strategy

- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: Feature development
- `hotfix/*`: Critical fixes

### Commit Convention

```bash
feat: add new authentication feature
fix: resolve login redirect issue
docs: update development guide
test: add RBAC test coverage
```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Sanity Documentation](https://www.sanity.io/docs)
- [Playwright Testing](https://playwright.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [NextAuth.js](https://next-auth.js.org/)

## 🆘 Common Issues & Solutions

### Environment Variables

Ensure all required environment variables are set in `.env.local` files for both Next.js and Sanity workspaces.

### Package Dependencies

If you encounter deprecated package warnings, update dependencies:

```bash
npm update
npm audit fix
```

### MongoDB Connection

Test MongoDB connection:

```bash
npm run test:db-connection
```

### Sanity Schema Updates

After updating Sanity schemas, redeploy the studio:

```bash
cd sanity && npm run deploy
```

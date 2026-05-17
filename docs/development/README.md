# 🛠️ Development Guide - Monorepo Setup & Workflow

**Last Updated**: December 26, 2024  
**Status**: ✅ PRODUCTION-READY DEVELOPMENT ENVIRONMENT  
**Monorepo**: pnpm workspaces with Next.js + Sanity CMS

> **Consolidated from**: `docs/monorepo/WORKSPACE_GUIDE.md`, `docs/DEVELOPMENT_GUIDE.md`, `WORKSPACE_SETUP.md`

---

## 🏗️ **Monorepo Architecture**

### **Project Structure Overview**

```
sustainable-eco-friendly-digital-nomads-directory/
├── app-next-directory/          # Next.js frontend application
│   ├── src/                     # Source code (components, pages, API routes)
│   ├── tests/e2e/               # Playwright test suites (120+ tests)
│   ├── __mocks__/               # Jest mocks for external dependencies
│   ├── jest.config.cjs          # Jest configuration with complex mocking
│   ├── playwright.config.ts     # E2E testing configuration
│   ├── next.config.ts           # Next.js config with image domains, redirects
│   └── eslint.config.mjs        # ESLint flat config
├── sanity/                      # Sanity CMS configuration
│   ├── schemas/                 # Content type definitions
│   ├── sanity.config.ts         # Studio configuration
│   └── package.json             # Sanity dependencies
├── listings/                    # Data processing & migration (Python scripts)
├── docs/                        # Comprehensive project documentation
├── scripts/                     # Utility scripts (validation, testing, CI)
└── package.json                 # Root workspace configuration (pnpm workspaces)
```

### **Workspace Configuration**

**Root `package.json` - Workspace Setup**:
```json
{
  "name": "sustainable-eco-friendly-digital-nomads-directory",
  "private": true,
  "workspaces": [
    "app-next-directory",
    "sanity"
  ],
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "dev": "concurrently \"pnpm dev:next\" \"pnpm dev:sanity\"",
    "dev:next": "pnpm --filter app-next-directory dev",
    "dev:sanity": "pnpm --filter sanity dev",
    "build": "pnpm build:next && pnpm build:sanity",
    "build:next": "pnpm --filter app-next-directory build",
    "build:sanity": "pnpm --filter sanity build",
    "test": "pnpm --filter app-next-directory test:e2e",
    "types:postprocess": "node sanity-types-postprocess.js"
  }
}
```

---

## 🚀 **Quick Start Guide**

### **Prerequisites**

```bash
# Required versions
Node.js 20.19.0+
pnpm 9.0+          # Primary package manager
npm 10.0+          # Fallback package manager
```

### **Initial Setup (First Time)**

```bash
# 1. Clone repository
git clone <repository-url>
cd sustainable-eco-friendly-digital-nomads-directory

# 2. Install dependencies (root level)
pnpm install

# 3. Environment setup (copy and configure)
cp app-next-directory/.env.sample app-next-directory/.env.local

# 4. Generate Sanity types
cd sanity
pnpm run update-types

# 5. Start development servers
pnpm dev
```

### **Development Servers**

```bash
# Start both Next.js and Sanity Studio
pnpm dev           # Starts both on :3000 and :3333

# Individual workspace commands
pnpm dev:next      # Next.js app on http://localhost:3000
pnpm dev:sanity    # Sanity Studio on http://localhost:3333

# Clean development start (after dependency changes)
pnpm dev:clean
```

---

## 📋 **Essential Commands**

### **Root Level Commands**

```bash
# Dependency Management
pnpm install                      # Install all workspace dependencies
pnpm add <package>               # Add to root workspace
pnpm --filter app-next-directory add <package>  # Add to specific workspace
pnpm --filter sanity add <package>              # Add to Sanity workspace

# Development Workflow
pnpm dev                         # Start all development servers
pnpm build                       # Build all workspaces for production
pnpm test                        # Run test suites across workspaces
pnpm lint                        # Lint all workspaces
pnpm types:check                 # TypeScript type checking
pnpm types:postprocess           # Generate and postprocess Sanity types

# Cleaning & Maintenance
pnpm clean                       # Clean all build artifacts
pnpm reset                       # Reset node_modules and reinstall
pnpm update                      # Update all dependencies
```

### **Next.js Workspace Commands**

```bash
cd app-next-directory/

# Development
npm run dev                      # Development server
npm run build                    # Production build + type generation
npm run start                    # Production server

# Testing
npm run test:jest                # Jest unit tests
npm run test:e2e                 # Playwright E2E tests (120+ tests)
npm run test:e2e -- --ui         # Interactive test runner
npm run test:coverage            # Coverage reports

# Code Quality
npm run lint                     # ESLint with flat config
npm run lint:fix                 # Auto-fix linting issues
npm run format                   # Prettier formatting
npm run types:check              # TypeScript validation

# Utilities
npm run validate:env             # Environment variable validation
npm run clean                    # Clean build artifacts
```

### **Sanity Workspace Commands**

```bash
cd sanity/

# Development
npm run dev                      # Sanity Studio development
npm run build                    # Build Studio for deployment
npm run deploy                   # Deploy Studio to Sanity hosting

# Type Generation
npm run update-types             # Generate TypeScript types from schemas
npm run extract:schema           # Extract schema definitions

# Data Management
npm run import                   # Import data from external sources
npm run export                   # Export content data
```

---

## 🔧 **Environment Configuration**

### **Required Environment Variables**

**File**: `app-next-directory/.env.local`

```bash
# Sanity CMS Configuration
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
# SANITY_STUDIO_DATASET=production  # Optional: set if the Studio should use a different dataset
SANITY_API_TOKEN=your_api_token_with_write_permissions

# MongoDB Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# NextAuth.js Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_32_character_secret_key

# Optional: OAuth Providers
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
# GitHub OAuth (NextAuth expects GITHUB_CLIENT_ID/GITHUB_CLIENT_SECRET)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Development Options
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### **Environment Validation**

```bash
# Validate environment setup
cd app-next-directory
npm run validate:env

# Expected output:
# ✅ NEXT_PUBLIC_SANITY_PROJECT_ID
# ✅ SANITY_API_TOKEN
# ✅ MONGODB_URI
# ✅ NEXTAUTH_SECRET
```

---

## 🎯 **Development Workflow**

### **Daily Development Process**

1. **Start Development Environment**
```bash
# Terminal 1: Start development servers
pnpm dev

# Terminal 2: Run tests in watch mode (optional)
cd app-next-directory
npm run test:jest -- --watch
```

2. **Code Development Cycle**
```bash
# Make code changes
# Auto-formatting occurs on save (Prettier + ESLint)

# Run type checking
npm run types:check

# Run relevant tests
npm run test:e2e -- tests/e2e/specific-feature/
```

3. **Pre-commit Workflow** (Automated via Husky)
```bash
# Automatically runs on git commit:
# 1. Prettier formatting
# 2. ESLint linting
# 3. TypeScript type checking
# 4. Test validation (if applicable)
```

### **Feature Development Process**

1. **Create Feature Branch**
```bash
git checkout -b feature/new-listing-feature
```

2. **Develop with Testing**
```bash
# Implement feature
# Write tests (E2E for user workflows, unit for utilities)
npm run test:e2e -- --headed  # Visual testing during development
```

3. **Validate Before Push**
```bash
# Full validation suite
npm run lint
npm run types:check
npm run test:e2e
npm run build  # Ensure production build works
```

4. **Schema Changes** (if applicable)
```bash
# Update Sanity schemas in sanity/schemas/
cd sanity
npm run update-types  # Regenerate TypeScript types

# Update frontend types
cd ../app-next-directory
npm run types:check   # Validate integration
```

---

## 🏗️ **Architecture Details**

### **Next.js Application Structure**

```
app-next-directory/src/
├── app/                         # Next.js 15+ App Router
│   ├── (auth)/                  # Auth route group
│   ├── (dashboard)/             # Dashboard route group  
│   ├── api/                     # API routes
│   │   ├── auth/[...nextauth]/  # NextAuth.js configuration
│   │   ├── listings/            # Listing management APIs
│   │   └── users/               # User management APIs
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
├── components/                  # Reusable UI components
│   ├── ui/                      # Base UI components (Radix-based)
│   ├── listings/                # Listing-specific components
│   ├── auth/                    # Authentication components
│   └── layout/                  # Layout components
├── lib/                         # Utility libraries
│   ├── auth/                    # Authentication utilities
│   ├── sanity/                  # Sanity client and helpers
│   ├── mongodb/                 # Database connection and models
│   └── utils/                   # General utilities
├── hooks/                       # Custom React hooks
├── types/                       # TypeScript type definitions
└── middleware.ts                # Next.js middleware (auth protection)
```

### **Sanity CMS Structure**

```
sanity/
├── schemas/                     # Content schema definitions
│   ├── documents/               # Main document types
│   │   ├── listing.ts          # Venue listings schema
│   │   ├── city.ts             # City information schema
│   │   ├── blogPost.ts         # Blog content schema
│   │   └── siteConfig.ts       # Global site configuration
│   ├── objects/                 # Reusable object types
│   │   ├── address.ts          # Address structure
│   │   ├── seo.ts              # SEO metadata
│   │   └── imageGallery.ts     # Image collections
│   └── index.ts                # Schema exports
├── lib/                        # Sanity utilities
├── components/                 # Custom Studio components
└── sanity.config.ts           # Studio configuration
```

---

## 🔨 **Build & Deployment Process**

### **Production Build**

```bash
# Full production build
pnpm build

# Individual workspace builds
pnpm build:next    # Next.js production build
pnpm build:sanity  # Sanity Studio build

# Validate build
cd app-next-directory
npm run start      # Test production server locally
```

### **Type Generation Workflow**

```bash
# 1. Update Sanity schemas (if changed)
cd sanity
npm run update-types

# 2. Post-process types for Next.js integration
cd ..
pnpm types:postprocess

# 3. Validate TypeScript across workspaces
pnpm types:check
```

### **CI/CD Pipeline Integration**

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20.19.0'
      - run: corepack enable
      - run: pnpm install
      - run: pnpm types:check
      - run: pnpm lint
      - run: pnpm build
      - run: pnpm test
```

---

## 🧪 **Testing in Development**

### **Test-Driven Development Workflow**

```bash
# 1. Write failing test first
cd app-next-directory
npm run test:e2e -- tests/e2e/new-feature.spec.ts --headed

# 2. Implement feature until tests pass
# 3. Refactor while maintaining test success

# 4. Add unit tests for complex logic
npm run test:jest -- src/__tests__/new-feature.test.ts --watch
```

### **Testing Different Scenarios**

```bash
# Cross-browser testing
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox
npm run test:e2e -- --project=webkit

# Authentication flow testing
npm run test:e2e -- tests/e2e/auth/ --headed

# Role-based access testing
npm run test:e2e -- tests/e2e/rbac/ --headed

# Performance testing
npm run test:e2e -- tests/e2e/performance/ --headed
```

---

## 🚨 **Troubleshooting**

### **Common Development Issues**

#### **1. Package Manager Issues**
```bash
# pnpm not found
npm install -g pnpm

# Dependency resolution issues
pnpm install --force
# or fallback to npm
npm install
```

#### **2. Type Generation Issues**
```bash
# Sanity types not generated
cd sanity
npm run update-types
cd ..
pnpm types:postprocess

# TypeScript errors after schema changes
pnpm types:check
# Fix any breaking changes in app-next-directory/src/
```

#### **3. Development Server Issues**
```bash
# Port conflicts (Next.js :3000, Sanity :3333)
lsof -ti:3000 | xargs kill -9  # Kill processes on port 3000
lsof -ti:3333 | xargs kill -9  # Kill processes on port 3333

# Environment variables not loading
npm run validate:env
# Check .env.local file exists and has correct format
```

#### **4. Build Failures**
```bash
# Clear build cache
npm run clean

# Clean node_modules and reinstall
pnpm reset

# Check for TypeScript errors
pnpm types:check
# Address any type issues before building
```

#### **5. Test Failures**
```bash
# Update Playwright browsers
npx playwright install

# Clear test cache
cd app-next-directory
npm run test:e2e -- --reporter=list  # Verbose output for debugging

# Database connection issues (for E2E tests)
# Check MONGODB_URI in .env.local
# Ensure test database is accessible
```

### **Performance Optimization**

#### **Development Server Performance**
```bash
# Use SWC for faster compilation (already configured)
# Ensure .next/ cache is not corrupted
rm -rf app-next-directory/.next
pnpm dev

# Optimize dependencies
pnpm dedupe  # Remove duplicate dependencies
```

#### **Build Performance**
```bash
# Parallel builds
pnpm build  # Already optimized for parallel execution

# Bundle analysis
cd app-next-directory
npm run build -- --analyze  # If configured
```

---

## 🔗 **IDE Setup & Extensions**

### **VS Code Configuration**

**Recommended Extensions**:
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Playwright Test for VS Code
- Sanity.io (for schema editing)
- Tailwind CSS IntelliSense

**Workspace Settings** (`.vscode/settings.json`):
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "playwright.reuseBrowser": true,
  "playwright.showTrace": true
}
```

---

## 🔗 **Related Documentation**

- **[Authentication & Security](../authentication-security/README.md)** - Security setup and implementation
- **[API Documentation](../api/README.md)** - API development and testing
- **[Testing Guide](../testing/README.md)** - Comprehensive testing strategies
- **[Deployment Guide](../deployment/README.md)** - Production deployment process

---

## 📞 **Getting Help**

### **Documentation Resources**
- **Internal Docs**: Comprehensive guides in `/docs` folder
- **Code Examples**: 120+ test cases demonstrate usage patterns
- **Configuration**: All config files include explanatory comments

### **Debug Tools**
- **Next.js Debug**: `DEBUG=* npm run dev`
- **Sanity Studio**: Built-in preview and validation tools
- **Playwright Debug**: `npm run test:e2e -- --debug`

**Development Status**: ✅ Production Ready  
**Last Updated**: December 26, 2024  
**Next Review**: March 2025

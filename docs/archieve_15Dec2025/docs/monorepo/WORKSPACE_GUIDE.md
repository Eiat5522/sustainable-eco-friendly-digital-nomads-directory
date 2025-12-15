# 🏗️ Workspace Management Guide

This guide covers working with **npm workspaces** in the Sustainable Eco-Friendly Digital Nomads Directory monorepo.

## 📦 Workspace Overview

Our monorepo uses **npm workspaces** to manage multiple related packages:

```json
{
  "name": "sustainable-eco-friendly-digital-nomads-directory-root",
  "workspaces": [
    "app-next-directory",    // Next.js frontend application
    "sanity"                 // Sanity CMS configuration
  ]
}
```

## 🚀 Getting Started with Workspaces

### **Initial Setup**
```bash
# Clone the repository
git clone <repository-url>
cd sustainable-eco-friendly-digital-nomads-directory

# Install all workspace dependencies
npm install

# This installs dependencies for:
# - Root package
# - app-next-directory package
# - sanity package
```

### **Workspace Structure**
```
sustainable-eco-friendly-digital-nomads-directory/
├── package.json                    # Root package with workspace config
├── package-lock.json               # Lockfile for all workspaces
├── node_modules/                   # Shared dependencies
├── app-next-directory/             # Frontend workspace
│   ├── package.json                # Frontend-specific dependencies
│   ├── src/                        # Application source code
│   └── ...
├── sanity/                         # CMS workspace
│   ├── package.json                # CMS-specific dependencies
│   ├── schemas/                    # Content schemas
│   └── ...
└── docs/                           # Documentation (not a workspace)
```

## 🛠️ Working with Workspaces

### **Root-Level Commands**
Commands available from the project root:

```bash
# Development
npm run dev                # Start Next.js development server
npm run dev:next           # Start Next.js only
npm run dev:sanity         # Start Sanity Studio only

# Building
npm run build              # Build both applications
npm run build:next         # Build Next.js only
npm run build:sanity       # Build Sanity only

# Production
npm run start              # Start Next.js production server
npm run start:next         # Start Next.js only
npm run start:sanity       # Start Sanity only

# Quality
npm run lint               # Lint Next.js application
npm run lint:next          # Lint Next.js only
npm run lint:sanity        # Lint Sanity only
```

### **Workspace-Specific Commands**
Commands run within individual workspaces:

```bash
# Navigate to specific workspace
cd app-next-directory

# Run workspace-specific commands
npm run dev                # Next.js development
npm run test               # Run Playwright tests
npm run test:auth          # Run auth tests only

# Navigate to Sanity workspace
cd ../sanity
npm run dev                # Sanity Studio development
npm run deploy             # Deploy studio to Sanity hosting
```

### **Cross-Workspace Commands**
Running commands in workspaces from root:

```bash
# Run command in specific workspace
npm run dev --workspace=app-next-directory
npm run build --workspace=sanity

# Install dependency in specific workspace
npm install lodash --workspace=app-next-directory
npm install @sanity/vision --workspace=sanity
```

## 📋 Dependency Management

### **Shared Dependencies**
Dependencies used by multiple workspaces are installed at the root:

```json
{
  "dependencies": {
    "@sanity/client": "^7.3.0",    // Used by both workspaces
    "react-hook-form": "^7.56.4",  // Shared form library
    "clsx": "^2.1.1"                // Utility library
  }
}
```

### **Workspace-Specific Dependencies**
Each workspace has its own package.json for workspace-specific dependencies:

**app-next-directory/package.json**:
```json
{
  "dependencies": {
    "next": "14.2.28",             // Next.js framework
    "next-auth": "^4.24.11",       // Authentication
    "mongodb": "6.16.0"            // Database client
  }
}
```

**sanity/package.json**:
```json
{
  "dependencies": {
    "sanity": "^3.89.0",           // Sanity Studio
    "@sanity/vision": "^3.89.0",   // Query tool
    "styled-components": "^6.1.15" // Styling
  }
}
```

### **Installing Dependencies**
```bash
# Install root dependency (shared)
npm install zod

# Install in specific workspace
npm install sharp --workspace=app-next-directory
npm install @sanity/color-input --workspace=sanity

# Install dev dependency
npm install --save-dev eslint --workspace=app-next-directory
```

## 🔄 Development Workflow

### **Parallel Development**
Run multiple workspaces simultaneously:

```bash
# Terminal 1: Next.js development
npm run dev:next

# Terminal 2: Sanity Studio development
npm run dev:sanity

# Or use a process manager like concurrently
npm install -g concurrently
concurrently "npm run dev:next" "npm run dev:sanity"
```

### **Environment Variables**
Each workspace can have its own environment configuration:

```
app-next-directory/.env.local       # Next.js environment
sanity/.env.local                   # Sanity environment
```

### **Cross-Workspace Data Flow**
```text
Development Data Flow:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Sanity Studio │    │   Sanity Cloud  │    │   Next.js App   │
│   localhost:3333│────│   sanity.io     │────│   localhost:3000│
│   (Content)     │    │   (API + CDN)   │    │   (Frontend)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🧪 Testing Across Workspaces

### **Running Tests**
```bash
# Run tests in specific workspace
npm run test --workspace=app-next-directory

# Run all integration tests
npm run test:integration --workspace=app-next-directory

# Test database connectivity
npm run test:db-connection --workspace=app-next-directory
```

### **Test Dependencies**
Testing tools are usually workspace-specific:

```json
// app-next-directory/package.json
{
  "devDependencies": {
    "@playwright/test": "^1.41.0",
    "jest": "^29.7.0"
  }
}
```

## 🚀 Deployment Considerations

### **Build Process**
```bash
# Build all workspaces for production
npm run build

# This runs:
# 1. npm run build:next    (builds Next.js app)
# 2. npm run build:sanity  (builds Sanity studio)
```

### **Environment Configuration**
Production environments need configuration for both workspaces:

**Vercel (Next.js)**:
- Deploy from `app-next-directory` directory
- Configure environment variables for Next.js

**Sanity Hosting (Studio)**:
- Deploy from `sanity` directory
- Configure Sanity project settings

## 🔍 Troubleshooting

### **Common Issues**

#### **Dependency Conflicts**
```bash
# Clear all node_modules and reinstall
rm -rf node_modules
rm -rf app-next-directory/node_modules
rm -rf sanity/node_modules
rm package-lock.json
npm install
```

#### **Workspace Command Not Found**
```bash
# Ensure you're in the correct directory
pwd
# Should show: .../sustainable-eco-friendly-digital-nomads-directory

# Check workspace configuration
npm ls --workspaces
```

#### **Port Conflicts**
```bash
# Next.js (3000) and Sanity (3333) use different ports
# If ports are busy, kill processes:
lsof -ti:3000 | xargs kill
lsof -ti:3333 | xargs kill
```

### **Workspace Debugging**
```bash
# List all workspaces
npm ls --workspaces

# Check workspace dependencies
npm ls --workspace=app-next-directory

# Audit workspace security
npm audit --workspace=sanity
```

## 📚 Best Practices

### **Dependency Management**
1. **Shared Dependencies**: Place common dependencies at root level
2. **Version Alignment**: Keep shared dependencies at same version
3. **Dev Dependencies**: Keep development tools workspace-specific

### **Scripts Organization**
1. **Root Scripts**: High-level operations (dev, build, deploy)
2. **Workspace Scripts**: Specific to workspace functionality
3. **Naming Convention**: Use `:workspace` suffix for clarity

### **Development**
1. **Environment Isolation**: Keep workspace environments separate
2. **Port Management**: Use different ports for each service
3. **Process Management**: Use process managers for parallel development

---

🔗 **Related Documentation**:
- [Development Setup](DEVELOPMENT_SETUP.md)
- [Next.js Workspace](../app-next-directory/README.md)
- [Sanity Workspace](../sanity/README.md)

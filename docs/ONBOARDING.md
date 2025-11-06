# Onboarding Guide

Welcome to the Sustainable Eco-Friendly Digital Nomads Directory project! This guide will walk you through setting up your development environment step by step.

## 🎯 Prerequisites

Before you begin, ensure you have:

- **Node.js**: Version 18.17.0 or later ([Download](https://nodejs.org/))
- **npm**: Version 9.6.7 or later (comes with Node.js)
- **Git**: Latest version ([Download](https://git-scm.com/))
- **Code Editor**: VS Code recommended ([Download](https://code.visualstudio.com/))

### Windows Prerequisites
- **PowerShell**: Version 7+ recommended ([Download](https://github.com/PowerShell/PowerShell))
- **Windows Terminal**: For better PowerShell experience ([Download](https://github.com/microsoft/terminal))

### Recommended Accounts (Free Tiers Available)
- **MongoDB Atlas**: For database ([Sign up](https://www.mongodb.com/cloud/atlas))
- **Sanity.io**: For content management ([Sign up](https://sanity.io))
- **GitHub**: For authentication (optional) ([Sign up](https://github.com))

## 🚀 Quick Start (2 Minutes)

### Step 1: Clone and Install
```bash
# Clone the repository
git clone https://github.com/Eiat5522/sustainable-eco-friendly-digital-nomads-directory.git
cd sustainable-eco-friendly-digital-nomads-directory

# Install all dependencies (this may take 2-3 minutes)
npm install
```

### Step 2: Environment Setup
```bash
# Copy environment template
cp .env.example app-next-directory/.env.local

# Edit the environment file
# Windows: notepad app-next-directory/.env.local
# Mac/Linux: nano app-next-directory/.env.local
```

### Step 3: Quick Test
```bash
# Test the setup
cd app-next-directory
npm run test:db-connection
```

**Expected Output (with placeholder config):**
```
❌ Error: MONGODB_URI not configured
📖 Please see MONGODB_SETUP.md for setup instructions
```

This is normal! Continue to the full setup below.

## 📋 Complete Setup Guide

### 1. Project Structure Understanding

This is a **monorepo** with workspaces:

```
sustainable-eco-friendly-digital-nomads-directory/
├── app-next-directory/          # 🌐 Main Next.js application
├── sanity/                      # 📝 Content management system
├── docs/                        # 📚 Documentation
├── listings/                    # 🗃️ Data processing scripts
└── scripts/                     # 🛠️ Utility scripts
```

### 2. Database Setup (MongoDB)

#### Option A: MongoDB Atlas (Recommended - Free)
1. **Create Account**: Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. **Create Cluster**: 
   - Choose "M0 Sandbox" (Free forever)
   - Select region closest to you
   - Cluster name: `sustainable-nomads-cluster`

3. **Database Access**:
   - Go to "Database Access" → "Add New Database User"
   - Username: `nomads-app`
   - Password: Generate secure password (save this!)
   - Privileges: "Read and write to any database"

4. **Network Access**:
   - Go to "Network Access" → "Add IP Address"
   - For development: Add `0.0.0.0/0` (Allow access from anywhere)
   - For production: Add specific IP addresses

5. **Get Connection String**:
   - Go to "Clusters" → "Connect" → "Connect your application"
   - Select "Node.js" and version "4.1 or later"
   - Copy the connection string

#### Option B: Local MongoDB (Development Only)
```bash
# Using Docker (recommended)
docker run --name mongodb -p 27017:27017 -d mongo:latest

# Connection string for local:
# mongodb://localhost:27017/sustainable-nomads
```

### 3. Content Management Setup (Sanity)

1. **Create Account**: Visit [sanity.io](https://sanity.io)
2. **Create Project**: 
   - Project name: "Sustainable Nomads Directory"
   - Dataset: "production"
3. **Get Configuration**:
   - Project ID: Found in project settings
   - API Token: Generate in "API" section with "Editor" permissions

### 4. Environment Configuration

Update `app-next-directory/.env.local` with your values:

```env
# Database (Required)
MONGODB_URI=mongodb+srv://nomads-app:YOUR_PASSWORD@sustainable-nomads-cluster.xxxxx.mongodb.net/sustainable-nomads?retryWrites=true&w=majority

# Authentication (Required)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_32_character_secret_here

# Sanity CMS (Required)
NEXT_PUBLIC_SANITY_PROJECT_ID=your_sanity_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_sanity_api_token
```

#### Generate NEXTAUTH_SECRET
```bash
# Windows PowerShell
[System.Web.Security.Membership]::GeneratePassword(32, 0)

# Mac/Linux
openssl rand -base64 32

# Or use online generator: https://generate-secret.vercel.app/32
```

### 5. Development Environment Setup

#### Install Dependencies
```bash
# From project root
npm install

# This installs dependencies for:
# - Root package
# - app-next-directory (Next.js app)
# - sanity (CMS Studio)
```

#### Verify Installation
```bash
# Test database connection
cd app-next-directory
npm run test:db-connection

# Expected output with proper config:
# ✅ MONGODB_URI: Configured
# ✅ Connection successful
```

## 🛠️ Development Workflow

### Starting Development Servers

#### Option 1: Individual Terminals
```bash
# Terminal 1: Next.js App
cd app-next-directory
npm run dev
# → http://localhost:3000

# Terminal 2: Sanity Studio
cd sanity  
npm run dev
# → http://localhost:3333
```

#### Option 2: From Root (Recommended)
```bash
# Start Next.js app
npm run dev

# Or start both services
npm run dev:next & npm run dev:sanity
```

### Essential Commands

#### Development
```bash
# Start development
npm run dev                 # Next.js app only
npm run dev:sanity         # Sanity Studio only

# Build for production
npm run build              # Build all workspaces
npm run build:next         # Build Next.js only

# Code quality
npm run lint               # Lint Next.js app
npm run format             # Format code with Prettier
```

#### Testing
```bash
cd app-next-directory

# Run all tests
npm run test

# Specific test suites
npm run test:auth          # Authentication tests
npm run test:api           # API security tests

# Interactive testing
npm run test:ui            # Playwright UI mode
npm run test:debug         # Debug mode
```

## 🧪 Verification Steps

### 1. Environment Check
```bash
cd app-next-directory
npm run test:db-connection
```
**Expected:** ✅ All environment variables configured

### 2. Application Start
```bash
npm run dev
```
**Expected:** App starts on http://localhost:3000

### 3. Basic Authentication Test
```bash
npm run test:auth
```
**Expected:** Authentication tests pass

### 4. Integration Test
```bash
npm run test:integration
```
**Expected:** Database and authentication integration works

## 🌍 Platform-Specific Instructions

### Windows PowerShell
```powershell
# Navigate to project
Set-Location -Path "path\to\sustainable-eco-friendly-digital-nomads-directory"

# Use clean install script (optional)
.\clean-install.ps1

# Environment setup
Copy-Item .env.example app-next-directory\.env.local
notepad app-next-directory\.env.local
```

### macOS/Linux Bash
```bash
# Navigate to project
cd ~/path/to/sustainable-eco-friendly-digital-nomads-directory

# Environment setup
cp .env.example app-next-directory/.env.local
nano app-next-directory/.env.local

# Alternative editors
code app-next-directory/.env.local  # VS Code
vim app-next-directory/.env.local   # Vim
```

## 🎯 Next Steps After Setup

### 1. Explore the Application
- Visit http://localhost:3000
- Test authentication flows
- Browse listings and features

### 2. Content Management
- Visit http://localhost:3333 (Sanity Studio)
- Explore content types and schemas
- Add test content

### 3. Development Tasks
- Check [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines
- Explore [Development Guide](./monorepo/DEVELOPMENT_SETUP.md) for advanced workflows
- Review [Workspace Guide](./monorepo/WORKSPACE_GUIDE.md) for monorepo management

### 4. Testing & Quality
- Run the full test suite
- Set up your code editor with project extensions
- Configure git hooks for code quality

## 🚨 Troubleshooting

### Common Issues

#### **Dependencies Won't Install**
```bash
# Clear caches and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### **Database Connection Fails**
1. Check MongoDB Atlas network access (IP whitelist)
2. Verify connection string format
3. Ensure database user has correct permissions

#### **Port Already in Use**
```bash
# Kill processes on ports 3000/3333
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux  
lsof -ti:3000 | xargs kill
lsof -ti:3333 | xargs kill
```

#### **Environment Variables Not Loading**
1. Ensure `.env.local` is in correct directory
2. Restart development server after changes
3. Check file naming (`.env.local`, not `.env`)

### Getting Help

1. **Documentation**: Check related docs in `docs/` directory
2. **Issues**: Search existing GitHub issues
3. **Community**: Join project discussions
4. **Code Review**: Submit PRs for review and feedback

## 🔗 Related Documentation

- [Environment Configuration](./ENVIRONMENT.md)
- [Development Setup](./monorepo/DEVELOPMENT_SETUP.md)
- [Workspace Management](./monorepo/WORKSPACE_GUIDE.md)
- [MongoDB Setup](../app-next-directory/MONGODB_SETUP.md)
- [Testing Guide](../app-next-directory/tests/README.md)

## ✅ Completion Checklist

Mark each item as you complete it:

- [ ] Prerequisites installed (Node.js, npm, Git)
- [ ] Repository cloned and dependencies installed
- [ ] MongoDB database configured
- [ ] Sanity CMS project created
- [ ] Environment variables configured
- [ ] Database connection test passes
- [ ] Development servers start successfully
- [ ] Basic authentication test passes
- [ ] Application loads in browser
- [ ] Sanity Studio accessible

**Congratulations!** 🎉 You're ready to contribute to the Sustainable Eco-Friendly Digital Nomads Directory!
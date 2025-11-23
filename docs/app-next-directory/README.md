# 🎨 Next.js Frontend Documentation

This directory contains documentation specific to the **app-next-directory** workspace - the main Next.js 14+ frontend application.

## 📋 Documentation Index

### **Core Documentation**
- [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md) - API routes and endpoints
- [`AUTHENTICATION.md`](AUTHENTICATION.md) - Authentication system implementation
- [`TESTING.md`](TESTING.md) - Testing strategies and guides
- [`COMPONENTS.md`](COMPONENTS.md) - Component documentation and usage

### **Implementation Guides**
- [`FORMS.md`](FORMS.md) - Form handling with React Hook Form + Zod
- [`STATE_MANAGEMENT.md`](STATE_MANAGEMENT.md) - Client-side state patterns
- [`STYLING.md`](STYLING.md) - Tailwind CSS usage and conventions

## 🚀 Quick Links

### **Development**
- **Main README**: [`../../app-next-directory/README.md`](../../app-next-directory/README.md)
- **Package.json**: [`../../app-next-directory/package.json`](../../app-next-directory/package.json)
- **Tests Directory**: [`../../app-next-directory/tests/`](../../app-next-directory/tests/)

### **Key Directories**
```
app-next-directory/
├── src/app/                    # Next.js App Router
├── src/components/             # React components
├── src/lib/                    # Utility functions
├── tests/                      # Playwright test suites
└── docs/                       # This documentation
```

## ✅ Implementation Status

### **Completed Features**
- ✅ **Authentication System**: NextAuth.js with JWT + RBAC
- ✅ **Testing Suite**: 120+ Playwright E2E tests
- ✅ **City Pages**: Dynamic routing with Sanity CMS
- ✅ **Component Library**: Radix UI + Tailwind CSS
- ✅ **TypeScript Setup**: Strict type checking

### **In Progress**
- 🔄 **API Endpoints**: Contact form, blog API, review system
- 🔄 **Search Features**: Advanced filtering and geo-search
- 🔄 **User Dashboard**: Profile management and favorites

### **Planned**
- ⏳ **Performance Optimization**: Caching and image optimization
- ⏳ **SEO Enhancement**: Meta tags and structured data
- ⏳ **Analytics Integration**: User behavior tracking

## 🛠️ Development Workflow

### **Local Development**
```bash
# Start development server
cd app-next-directory
npm run dev
```

### **Testing**
```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:auth
npm run test:rbac
npm run test:api
```

### **Build & Deploy**
```bash
# Build for production
npm run build

# Start production server
npm run start
```

## 📦 Workspace Context

This workspace is part of the monorepo structure:

```json
{
  "workspaces": [
    "app-next-directory",    // ← This workspace
    "sanity"                 // CMS configuration
  ]
}
```

**Dependencies**: This workspace depends on schemas and data from the `sanity` workspace.

---

🔗 **Related Documentation**:
- [Monorepo Setup](../monorepo/DEVELOPMENT_SETUP.md)
- [Sanity CMS Documentation](../sanity/README.md)
- [Shared Guidelines](../shared/CODING_STANDARDS.md)

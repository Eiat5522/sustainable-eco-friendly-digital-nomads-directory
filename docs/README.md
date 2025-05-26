# 📚 Documentation Structure

This directory contains comprehensive documentation for the **Sustainable Eco-Friendly Digital Nomads Directory** monorepo.

## 🗂️ Documentation Organization

Our documentation is organized according to the **workspace structure**:

```
docs/
├── README.md                    # This overview (you are here)
├── monorepo/                    # Monorepo-wide documentation
│   ├── WORKSPACE_GUIDE.md       # Working with npm workspaces
│   ├── DEVELOPMENT_SETUP.md     # Complete development setup
│   └── DEPLOYMENT_GUIDE.md      # Production deployment
├── app-next-directory/          # Next.js frontend documentation
│   ├── README.md                # Frontend overview
│   ├── API_DOCUMENTATION.md     # API routes and endpoints
│   ├── AUTHENTICATION.md        # Auth system implementation
│   ├── TESTING.md               # Testing strategies and guides
│   └── COMPONENTS.md            # Component documentation
├── sanity/                      # Sanity CMS documentation
│   ├── README.md                # CMS overview
│   ├── SCHEMA_GUIDE.md          # Content schemas and models
│   ├── MIGRATION_GUIDE.md       # Data migration procedures
│   └── CONTENT_WORKFLOW.md      # Editorial workflow
├── shared/                      # Cross-workspace documentation
│   ├── CODING_STANDARDS.md      # Code style and conventions
│   ├── GIT_WORKFLOW.md          # Branch strategy and commits
│   └── TROUBLESHOOTING.md       # Common issues and solutions
└── assets/                      # Documentation assets
    ├── images/                  # Screenshots and diagrams
    └── brand/                   # Brand guidelines and assets
```

## 🚀 Quick Navigation

### **For Developers**
- **🏁 Getting Started**: [`monorepo/DEVELOPMENT_SETUP.md`](monorepo/DEVELOPMENT_SETUP.md)
- **⚙️ Workspace Management**: [`monorepo/WORKSPACE_GUIDE.md`](monorepo/WORKSPACE_GUIDE.md)
- **📋 Coding Standards**: [`shared/CODING_STANDARDS.md`](shared/CODING_STANDARDS.md)

### **For Frontend Work**
- **🎨 Next.js App**: [`app-next-directory/README.md`](app-next-directory/README.md)
- **🔐 Authentication**: [`app-next-directory/AUTHENTICATION.md`](app-next-directory/AUTHENTICATION.md)
- **🧪 Testing Guide**: [`app-next-directory/TESTING.md`](app-next-directory/TESTING.md)

### **For Content Management**
- **📝 Sanity CMS**: [`sanity/README.md`](sanity/README.md)
- **🗃️ Content Schemas**: [`sanity/SCHEMA_GUIDE.md`](sanity/SCHEMA_GUIDE.md)
- **🔄 Data Migration**: [`sanity/MIGRATION_GUIDE.md`](sanity/MIGRATION_GUIDE.md)

### **For Deployment**
- **🚀 Production Deploy**: [`monorepo/DEPLOYMENT_GUIDE.md`](monorepo/DEPLOYMENT_GUIDE.md)
- **🐛 Troubleshooting**: [`shared/TROUBLESHOOTING.md`](shared/TROUBLESHOOTING.md)

## 📦 Workspace Context

This documentation reflects our **npm workspaces** structure:

```json
{
  "workspaces": [
    "app-next-directory",    // Next.js frontend application
    "sanity"                 // Sanity CMS configuration
  ]
}
```

Each workspace has its own dedicated documentation section while shared concerns are documented in cross-cutting sections.

## 🔄 Documentation Maintenance

- **Update Frequency**: Documentation is updated with each major feature or architectural change
- **Review Process**: Documentation changes are reviewed as part of the PR process
- **Version Control**: All documentation is version-controlled alongside code
- **Format**: We use Markdown with consistent formatting and emoji indicators

## 🤝 Contributing to Documentation

See [`../CONTRIBUTING.md`](../CONTRIBUTING.md) for guidelines on:
- Documentation style and formatting
- Adding new documentation sections
- Updating existing documentation
- Review and approval process

---

📌 **Need help?** Check the [`shared/TROUBLESHOOTING.md`](shared/TROUBLESHOOTING.md) or create an issue in the repository.

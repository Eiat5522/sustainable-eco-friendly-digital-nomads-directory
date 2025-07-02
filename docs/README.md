# 📚 Documentation Structure

This directory contains all project documentation for the **Sustainable Eco-Friendly Digital Nomads Directory** monorepo.

---

## 🗂️ Documentation Organization

Documentation is organized by domain and workstream:

```
docs/
├── README.md                    # This overview (you are here)
├── app-next-directory/          # Next.js app documentation
├── sanity/                      # Sanity CMS documentation
├── shared/                      # Cross-domain/project docs
├── assets/                      # Images, diagrams, brand assets
├── monorepo/                    # Monorepo-level guides
├── Testing/                     # Testing guides and coverage
```

### Key Subfolders

- `app-next-directory/`: Frontend, API, authentication, testing, and component docs
- `sanity/`: CMS overview, schema guides, migration, editorial workflow
- `shared/`: Coding standards, git workflow, troubleshooting
- `assets/`: Images, diagrams, and brand assets
- `monorepo/`: Monorepo setup, deployment, and workspace management
- `Testing/`: Playwright, E2E, and unit testing documentation

---

## 🚦 Status

- All legacy documentation migrated to this structure
- Six key context files retained in [`memory-bank/`](../memory-bank/)
- All references to old doc locations updated
- Documentation reflects completed workstreams (A–D2), admin dashboard, analytics, geo-search, and integration/testing phase readiness
- Troubleshooting guides and deployment checklist available in [`shared/`](shared/) and [`monorepo/`](monorepo/)

---

## 🔗 Quick Navigation

- [Frontend Overview](app-next-directory/README.md)
- [Sanity CMS Overview](sanity/README.md)
- [Coding Standards](shared/CODING_STANDARDS.md)
- [Deployment Guide](monorepo/DEPLOYMENT_GUIDE.md)
- [Testing Guide](Testing/README.md)
- [Troubleshooting](shared/TROUBLESHOOTING.md)
- [Deployment Checklist](monorepo/DEPLOYMENT_GUIDE.md#deployment-checklist)

---

## 📝 Notes

- This documentation reflects the current npm workspaces and monorepo structure.
- For context and session logs, see [`memory-bank/`](../memory-bank/).
- All new features, admin endpoints, and technical changes are documented in their respective sections.
- For the latest project status, see [`memory-bank/activeContext.md`](../memory-bank/activeContext.md) and [`memory-bank/progress.md`](../memory-bank/progress.md).

---

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
- **✅ Deployment Checklist**: [`monorepo/DEPLOYMENT_GUIDE.md#deployment-checklist`](monorepo/DEPLOYMENT_GUIDE.md#deployment-checklist)

---

## 📦 Workspace Context

This documentation reflects our **npm workspaces** structure:

```json
{
  "workspaces": [
    "app-next-directory", // Next.js frontend application
    "sanity" // Sanity CMS configuration
  ]
}
```

Each workspace has its own dedicated documentation section while shared concerns are documented in cross-cutting sections.

---

## 🔄 Documentation Maintenance

- **Update Frequency**: Documentation is updated with each major feature or architectural change
- **Review Process**: Documentation changes are reviewed as part of the PR process
- **Version Control**: All documentation is version-controlled alongside code
- **Format**: We use Markdown with consistent formatting and emoji indicators

---

## 🤝 Contributing to Documentation

See [`../CONTRIBUTING.md`](../CONTRIBUTING.md) for guidelines on:

- Documentation style and formatting
- Adding new documentation sections
- Updating existing documentation
- Review and approval process

---

📌 **Need help?** Check the [`shared/TROUBLESHOOTING.md`](shared/TROUBLESHOOTING.md) or create an issue in the repository.

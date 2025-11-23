# 📝 Sanity CMS Documentation

This directory contains documentation specific to the **sanity** workspace - the Sanity Content Studio configuration and content management system.

## 📋 Documentation Index

### **Core Documentation**
- [`SCHEMA_GUIDE.md`](SCHEMA_GUIDE.md) - Content schemas and data models
- [`MIGRATION_GUIDE.md`](MIGRATION_GUIDE.md) - Data migration procedures and scripts
- [`CONTENT_WORKFLOW.md`](CONTENT_WORKFLOW.md) - Editorial workflow and content management
- [`API_INTEGRATION.md`](API_INTEGRATION.md) - Integration with Next.js frontend

### **Configuration Guides**
- [`STUDIO_SETUP.md`](STUDIO_SETUP.md) - Studio configuration and customization
- [`DEPLOYMENT.md`](DEPLOYMENT.md) - Deploying Sanity Studio to hosting

## 🎯 Content Management Overview

### **Content Types**
- **🏢 Listings**: Venues, coworking spaces, accommodations
- **🏙️ Cities**: Geographic information and featured locations
- **📝 Blog Posts**: Editorial content and sustainability articles
- **⚙️ Site Configuration**: Global settings and navigation
- **👤 Authors**: Content creator profiles

### **Data Flow**
```text
Content Creation Flow:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Sanity Studio │    │   Sanity Cloud  │    │   Next.js App   │
│   (Content)     │────│   (API + CDN)   │────│   (Frontend)    │
│   localhost:3333│    │   sanity.io     │    │   localhost:3000│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### **Access Sanity Studio**
```bash
# Navigate to sanity workspace
cd sanity

# Install dependencies
npm install

# Start development studio
npm run dev

# Access at http://localhost:3333
```

### **Content Management Tasks**
- **Create Listings**: Add new venues with sustainability features
- **Manage Cities**: Update geographic and tourist information
- **Publish Articles**: Editorial content about eco-friendly travel
- **Configure Site**: Global settings and navigation structure

## 📂 Workspace Structure

```
sanity/
├── schemas/                    # Content type definitions
│   ├── listing.ts              # Venue listing schema
│   ├── city.ts                 # City information schema
│   ├── blogPost.ts             # Blog post schema
│   └── siteConfig.ts           # Site configuration schema
├── static/                     # Static assets for studio
├── .env.local                  # Environment configuration
├── sanity.config.ts            # Studio configuration
└── package.json                # Dependencies and scripts
```

## 🔗 Integration Points

### **With Next.js Frontend**
- **Data Fetching**: Sanity client in `app-next-directory/src/lib/sanity/`
- **Image Optimization**: Sanity Image URLs with next/image
- **Real-time Updates**: Webhook integration for content changes
- **Preview Mode**: Draft content preview in Next.js

### **Data Migration**
- **Python Scripts**: Located in `/listings` directory
- **CSV Processing**: Bulk import of venue data
- **Image Migration**: Asset upload and optimization
- **Data Validation**: Schema compliance checking

## ✅ Implementation Status

### **Completed Features**
- ✅ **Content Schemas**: All core content types defined
- ✅ **Studio Configuration**: Customized editing experience
- ✅ **Data Migration**: Python scripts for bulk import
- ✅ **Frontend Integration**: Sanity client setup in Next.js

### **In Progress**
- 🔄 **Image Processing**: Automated optimization pipeline
- 🔄 **Webhook Setup**: Real-time content synchronization
- 🔄 **Advanced Schemas**: Complex content relationships

### **Planned**
- ⏳ **Workflow Customization**: Editorial review process
- ⏳ **Plugin Integration**: Enhanced studio functionality
- ⏳ **Backup Procedures**: Automated content backup

## 🛠️ Development Commands

```bash
# Sanity Studio commands
npm run dev              # Start development studio
npm run build            # Build for production
npm run deploy           # Deploy studio to Sanity hosting

# GraphQL API
npm run deploy-graphql   # Deploy GraphQL API layer

# Data management
npm run export           # Export content data
npm run import           # Import content data
```

## 📦 Workspace Context

This workspace is part of the monorepo structure:

```json
{
  "workspaces": [
    "app-next-directory",    // Frontend consumer
    "sanity"                 // ← This workspace
  ]
}
```

**Consumers**: The `app-next-directory` workspace consumes content from this Sanity configuration.

## 🔐 Access & Permissions

### **Studio Access**
- **Sanity Account Required**: Login with Sanity credentials
- **Project Permissions**: Role-based access (admin, editor, viewer)
- **Content Workflow**: Draft/publish state management

### **API Access**
- **Read Tokens**: Public content access for frontend
- **Write Tokens**: Protected admin operations
- **Webhook Secrets**: Secure real-time updates

## 📚 Resources

### **Sanity Documentation**
- **Getting Started**: [Sanity.io Documentation](https://www.sanity.io/docs)
- **Schema Types**: [Schema Type Reference](https://www.sanity.io/docs/schema-types)
- **Studio Configuration**: [Studio Configuration Guide](https://www.sanity.io/docs/configuration)

### **Community Resources**
- **Community Slack**: [Sanity Community](https://slack.sanity.io/)
- **Plugin Repository**: [Sanity Plugins](https://www.sanity.io/plugins)
- **Examples**: [Sanity Templates](https://www.sanity.io/templates)

---

🔗 **Related Documentation**:
- [Next.js Integration](../app-next-directory/README.md)
- [Data Migration Scripts](../../listings/README.md)
- [Monorepo Setup](../monorepo/DEVELOPMENT_SETUP.md)

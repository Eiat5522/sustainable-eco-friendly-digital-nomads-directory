# Sanity CMS Studio – Sustainable Eco-Friendly Digital Nomads Directory

This is the **Sanity Content Studio** configuration for the Sustainable Eco-Friendly Digital Nomads Directory. It powers content management for listings, cities, blog posts, site configuration, and user-generated content.

---

## 🎯 Purpose

Sanity Studio serves as the **headless CMS backend** for managing:

- **Venue Listings**: Coworking spaces, cafes, accommodations, events
- **City Information**: Location data, descriptions, featured venues
- **Blog Content**: Sustainability and digital nomad articles
- **Site Configuration**: Global settings, navigation, metadata
- **User-Generated Content**: Reviews, ratings, community submissions

---

## 🚀 Quick Start

### Prerequisites

```bash
Node.js 18.17.0+ required
pnpm 8.6.3+ required
```

### Setup & Development

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Start the Sanity Studio:**
   ```bash
   pnpm dev
   ```

3. **Access the studio:**
   - Studio URL: [http://localhost:3333](http://localhost:3333)
   - Login with your Sanity account credentials

---

## 📦 Monorepo Integration

This Sanity configuration is part of the monorepo:

```
sustainable-eco-friendly-digital-nomads-directory/
├── app-next-directory/   # Next.js frontend (consumes Sanity data)
├── sanity/               # This Sanity Studio configuration
├── listings/             # Data migration & processing scripts
└── ...
```

- **Next.js App**: Consumes content via `@sanity/client`
- **Migration Scripts**: Use Sanity HTTP API for data import/export
- **Shared Content Types**: Defined in `sanity/schemas/`

---

## 🗂️ Documentation

- All Sanity documentation is in [`docs/sanity/`](../docs/sanity/).
- See [`docs/README.md`](../docs/README.md) for project-wide navigation.

### Core Content Types

- **Listing**: Venue info, sustainability features, amenities, images
- **City**: Geographic info, featured venues, highlights
- **Blog Post**: Editorial content, SEO fields, author attribution
- **Site Configuration**: Global settings, navigation, contact info

**Note**: The schemas have been recently realigned to improve consistency and support DTO-based data handling.

---

## 🔧 Development Commands

```bash
# Start development studio
pnpm dev

# Build for production
pnpm build

# Deploy studio to Sanity hosting
pnpm deploy

# Deploy GraphQL API
pnpm deploy-graphql

# Generate TypeScript types for schemas
pnpm codegen
```

---

## 🔗 API Integration

Sanity Studio connects to the Next.js frontend through:

- **@sanity/client**: Data fetching
- **@sanity/image-url**: Optimized images
- **Webhooks**: Real-time content sync
- **Preview Mode**: Draft content preview in Next.js
- **Sanity Codegen**: Automatically generates TypeScript types for schemas, ensuring type safety and consistency across the application.

---

## 📚 Resources & Documentation

- [Sanity Docs – Getting Started](https://www.sanity.io/docs/introduction/getting-started)
- [Sanity Community Slack](https://slack.sanity.io/)
- [Content Modeling](https://www.sanity.io/docs/content-modelling)
- [Sanity Plugins](https://www.sanity.io/docs/content-studio/extending)

---

## 🔐 Access & Permissions

- **Sanity Account Authentication**: Login required
- **Project Permissions**: Role-based access (admin, editor, viewer)
- **Content Workflow**: Draft/publish state management

For access requests, contact the project administrator.

---

_Last updated: July 30, 2025_
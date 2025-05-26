# Sanity CMS Studio - Sustainable Eco-Friendly Digital Nomads Directory

This is the **Sanity Content Studio** configuration for the Sustainable Eco-Friendly Digital Nomads Directory project. It provides content management capabilities for listings, blog posts, cities, and site configuration.

## 🎯 Purpose

The Sanity Studio serves as the **headless CMS backend** for managing:

- **Venue Listings**: Coworking spaces, cafes, accommodations, and events
- **City Information**: Location data, descriptions, and featured venues
- **Blog Content**: Articles about sustainability and digital nomad lifestyle
- **Site Configuration**: Global settings, navigation, and metadata
- **User-Generated Content**: Reviews, ratings, and community submissions

## 🚀 Quick Start

### Prerequisites

```bash
Node.js 18.17.0+ required
npm 9.6.7+ required
```

### Setup & Development

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start the Sanity Studio:**

   ```bash
   npm run dev
   ```

3. **Access the studio:**
   - Studio URL: [http://localhost:3333](http://localhost:3333)
   - Login with your Sanity account credentials

## 📦 Integration with Monorepo

This Sanity configuration is part of a **monorepo structure**:

```text
sustainable-eco-friendly-digital-nomads-directory/
├── app-next-directory/          # Next.js frontend (consumes Sanity data)
├── sanity/                      # This Sanity Studio configuration
├── listings/                    # Data migration & processing scripts
└── ...
```

### Cross-Project Dependencies

- **Next.js App** consumes content via Sanity client (`@sanity/client`)
- **Migration Scripts** in `/listings` interact with Sanity HTTP API
- **Shared content types** defined in `sanity/schemas/`

## �️ Content Schema

### Core Content Types

1. **Listing** (`listing.ts`)
   - Venue information (name, description, location)
   - Sustainability features and certifications
   - Amenities and digital nomad facilities
   - Images and gallery

2. **City** (`city.ts`)
   - Geographic information and boundaries
   - Featured venues and highlights
   - Tourism and nomad-specific information

3. **Blog Post** (`blogPost.ts`)
   - Editorial content about sustainability
   - SEO optimization fields
   - Author attribution and publishing workflow

4. **Site Configuration** (`siteConfig.ts`)
   - Global site settings
   - Navigation structure
   - Contact information and social links

## 🔧 Development Commands

```bash
# Start development studio
npm run dev

# Build for production
npm run build

# Deploy studio to Sanity hosting
npm run deploy

# Deploy GraphQL API
npm run deploy-graphql
```

## 🔗 API Integration

The Sanity Studio connects to the Next.js frontend through:

- **Client Library**: `@sanity/client` for data fetching
- **Image URLs**: `@sanity/image-url` for optimized images
- **Real-time Updates**: Webhooks for content synchronization
- **Preview Mode**: Draft content preview in Next.js

## 📚 Resources & Documentation

- **Sanity Documentation**: [Getting Started Guide](https://www.sanity.io/docs/introduction/getting-started)
- **Community Support**: [Sanity Community Slack](https://slack.sanity.io/)
- **Schema Reference**: [Content Modeling](https://www.sanity.io/docs/content-modelling)
- **Plugin Ecosystem**: [Sanity Plugins](https://www.sanity.io/docs/content-studio/extending)

## 🔐 Access & Permissions

Access to the Sanity Studio is controlled through:

- **Sanity Account Authentication**: Login required
- **Project Permissions**: Role-based access (admin, editor, viewer)
- **Content Workflow**: Draft/publish state management

For access requests, contact the project administrator.

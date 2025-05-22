# 📦 Sustainable Digital Nomads Directory - Project Rules

## 🚨 Critical Notes for Cline

- **Project Context**: This is a sustainable digital nomads directory with Sanity CMS and Next.js 14
- **Current Phase**: City pages implementation with carousel fixes and image handling
- **Change Directory**: Use PowerShell 7 commands like `Set-Location` instead of `cd`
- **Task Updates**: Always update task status in `tasks/task_breakdown.md` after completion

## 🛠️ Tech Stack (CURRENT IMPLEMENTATION)

### Frontend & Framework

- **Next.js 14.2.28** (App Router) - Security patched version
- **React 18** with TypeScript
- **Tailwind CSS 3.4** with custom animations and plugins
- **Framer Motion** for animations and transitions

### CMS & Data

- **Sanity CMS** (implemented and configured)
- **Sanity Image CDN** for optimized image delivery
- **MongoDB Atlas** for user data (future implementation)

### UI Components & Libraries

- **Embla Carousel** for image carousels
- **Lucide React** for icons
- **Next/Image** for optimized images

### Development Tools

- **TypeScript 5** for type safety
- **ESLint & Prettier** for code quality
- **Playwright** for E2E testing

## 🗂️ Project Structure (CURRENT STATE)

```
📂 /app-scaffold           # Main Next.js application
  /src
    /app                   # Next.js App Router (layout.tsx, page.tsx)
      /city/[slug]         # ✅ City detail pages (IMPLEMENTED)
      /listing/[slug]      # Listing detail pages
      /api                 # API route handlers
    /components            # React components
      /home                # ✅ Home page components (CitiesCarousel)
      /listings            # ✅ Listing components (CityCarousel, ListingCard)
      /ui                  # Reusable UI components
    /lib                   # Utilities and configurations
      /sanity              # ✅ Sanity client and queries (IMPLEMENTED)
    /types                 # ✅ TypeScript interfaces (UPDATED)
  /public                  # Static assets
  /scripts                 # Build and utility scripts

📂 /sanity                 # ✅ Sanity CMS (CONFIGURED)
  /schemas               # Content schemas
  /schemaTypes           # Schema type definitions

📂 /listings               # Raw listing data and processing scripts
📂 /memory-bank            # Project context and documentation
📂 /tasks                  # ✅ Task breakdown and status tracking
📂 /.clinerules            # Project configuration files
```

## � Current Implementation Status

### ✅ COMPLETED

- Sanity CMS setup and configuration
- City schema with image handling
- City detail pages with modern UI
- Carousel components with Embla
- Image optimization via Sanity CDN
- TypeScript interfaces for type safety
- Tailwind CSS with custom animations
- Responsive design implementation

### 🚧 IN PROGRESS

- Carousel TypeScript type fixes
- Documentation updates
- Testing carousel functionality

### 📋 PENDING

- User authentication system
- Listing creation/editing
- Search and filtering
- Payment integration
- Mobile app development

## 🌐 API Routes & Data Flow (CURRENT IMPLEMENTATION)

### Sanity CMS Integration

- **GET /api/cities** - Fetch all cities (via Sanity queries)
- **GET /api/listings** - Fetch listings with filters
- **GET /api/listings/[slug]** - Individual listing details
- **GET /api/city/[slug]** - City details with filtered listings

### Data Queries (Implemented)

```javascript
// City queries with proper image handling
const cityProjection = `{
  _id,
  title,
  "slug": slug.current,
  country,
  description,
  mainImage {
    asset->{
      _id,
      url,
      metadata {
        dimensions {
          width,
          height
        }
      }
    }
  },
  sustainabilityScore,
  highlights
}`
```

### Image Handling

- **Sanity CDN**: Optimized image delivery with responsive sizing
- **Next/Image**: Automatic optimization and lazy loading
- **Fallback Images**: Proper error handling for missing images

## 🚀 Development Workflow (UPDATED)

### Current Development Process

1. **PowerShell 7**: Use `Set-Location` for directory navigation
2. **Task Tracking**: Update `tasks/task_breakdown.md` after each completion
3. **Type Safety**: Maintain TypeScript interfaces in `/src/types/`
4. **Component Development**: Modern React patterns with hooks and contexts
5. **Styling**: Tailwind CSS with custom animations and responsive design

### Build & Deploy

- **Development**: `npm run dev` in `/app-scaffold`
- **Sanity Studio**: Access via Sanity dashboard
- **Type Checking**: Continuous TypeScript validation
- **Testing**: Playwright for E2E testing

### Code Quality Standards

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality enforcement
- **Image Optimization**: Proper aspect ratios and responsive images
- **Performance**: Lazy loading and optimized bundles

---
applyTo: "**"
---

# Sustainable Digital Nomads Directory – Copilot Instructions

## 1. Project Overview

**Architecture**: Monorepo with Next.js 15+ (App Router), Sanity CMS, TypeScript  
**Core Technologies**: Tailwind CSS, MongoDB Atlas, Leaflet.js, NextAuth.js, Stripe  
**Testing**: Jest (unit), Playwright (E2E), React Testing Library  
**Deployment**: Vercel with GitHub Actions CI/CD  

**Repository Structure**:
```
├── app-next-directory/    # Next.js frontend application
├── sanity/               # Sanity CMS configuration  
├── .github/              # GitHub workflows and configurations
└── docs/                 # Project documentation
```

## 2. Development Standards

### Code Quality
- **TypeScript**: Strict mode enabled, proper type definitions required
- **Linting**: ESLint with Next.js recommended rules (`next lint`)
- **Formatting**: Prettier for consistent code style
- **Testing**: Jest for units, Playwright for E2E, minimum 80% coverage target

### API Routes & Backend
- **Structure**: Follow `/app/api/*` pattern in app-next-directory
- **Authentication**: NextAuth.js with MongoDB adapter
- **Validation**: Zod schemas for request/response validation
- **Error Handling**: Standardized error responses with proper HTTP status codes

### Frontend Patterns
- **Components**: React functional components with TypeScript
- **Styling**: Tailwind CSS utility classes, component-based design
- **State Management**: React hooks, context for global state
- **Forms**: React Hook Form with Zod validation

## 3. Sanity CMS Guidelines

### Schema Design
- **Key Documents**: `listing`, `city`, `blogPost`, `author`, `siteConfig`
- **Image Fields**: Always include `alt` text and `hotspot: true`
- **Validation**: Use Sanity's validation API (`Rule.required()`, etc.)
- **Slugs**: Auto-generate with proper source fields

### Data Structure
```typescript
// Example listing schema structure
{
  title: string
  slug: { current: string }
  listingType: 'coworking' | 'accommodation' | 'cafe'
  mainImage: { asset, alt, hotspot }
  address: { street, city, country, coordinates }
  amenities: string[]
  sustainabilityFeatures: string[]
  priceRange: 'budget' | 'mid' | 'premium'
  rating: number
  isFeatured: boolean
  status: 'published' | 'draft'
}
```

## 4. Package Management & Dependencies

- **Package Manager**: Use `pnpm` exclusively for all operations
- **Commands**: Run from appropriate directory (`app-next-directory` or `sanity`)
- **Installation**: `pnpm install` for dependencies, `pnpm add -D` for dev dependencies
- **Scripts**: Use workspace scripts from root (`pnpm dev`, `pnpm build`, `pnpm test`)

## 5. Security & Performance

### Security Best Practices
- **Environment Variables**: Store secrets in Vercel environment configuration
- **Input Validation**: Validate all user inputs with Zod schemas
- **HTTPS**: Enforce secure headers via Next.js middleware
- **Authentication**: Secure session handling with NextAuth.js

### Performance Guidelines
- **Images**: Use Next.js Image component with proper optimization
- **Code Splitting**: Dynamic imports for route-level splitting
- **Caching**: Implement proper cache strategies for API routes
- **Bundle Analysis**: Regular bundle size monitoring

## 6. Testing Strategy

### Unit Testing (Jest)
- **Location**: `app-next-directory/tests/` or `__tests__/` directories
- **Patterns**: Test utilities, custom hooks, API routes
- **Mocking**: Mock external dependencies (Sanity, NextAuth, etc.)
- **Coverage**: Aim for 80%+ coverage on critical paths

### E2E Testing (Playwright)
- **Config**: `playwright.config.ts` with multiple browsers
- **Patterns**: User journeys, form submissions, authentication flows
- **Data**: Use test data fixtures, avoid production data

## 7. Error Handling & Debugging

### Development Workflow
- **Check errors immediately**: Address linting/build errors before proceeding
- **Self-correct once**: Attempt obvious fixes, then ask for guidance
- **Context preservation**: Maintain error context in logs and messages

### Debugging Tools
- **Browser DevTools**: React DevTools, Network panel
- **Server Logs**: Vercel logs, console.log strategically
- **Testing**: Use Jest's debugging capabilities

## 8. AI Assistant Guidelines

### Prompt Clarity
- **Be specific**: Include exact requirements, file paths, expected outcomes
- **Provide context**: Share relevant code snippets, error messages
- **Ask for clarification**: When requirements are ambiguous

### Code Generation Standards
- **Follow project patterns**: Match existing code style and structure
- **Include error handling**: Add try/catch blocks and validation
- **Add documentation**: JSDoc comments for complex functions
- **Consider edge cases**: Handle null/undefined values appropriately

### Task Management
- **Link to objectives**: Connect code changes to known tasks/features
- **Confirm completion**: Verify task requirements are met
- **Update status**: Mark tasks as in-progress or completed appropriately

## 9. Deployment & CI/CD

### GitHub Actions
- **Triggers**: Push to main, pull requests
- **Jobs**: Lint, test, build, deploy to Vercel
- **Environment**: Staging and production environments

### Vercel Configuration
- **Framework**: Next.js preset with automatic deployments
- **Environment Variables**: Secure storage for API keys, database URLs
- **Preview Deployments**: Automatic for pull requests

---

*Follow these guidelines to ensure consistent, high-quality contributions to the Sustainable Digital Nomads Directory project.*
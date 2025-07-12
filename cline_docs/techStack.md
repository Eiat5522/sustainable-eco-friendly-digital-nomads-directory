# Tech Stack (cline_docs/techStack.md)

This document outlines the key technology choices and architectural decisions for the 'Sustainable Digital Nomads in Thailand' project. It is based on `projectbrief.md` and `.clinerules/clinerules.md`.

## Core Technologies
- **Frontend Framework:** Next.js 15.3.2 (App Router)
  - *Justification:* Enables Server-Side Rendering (SSR) and Static Site Generation (SSG) for performance and SEO, provides API route capabilities, benefits from a large ecosystem, and integrates seamlessly with Vercel for deployment.
  - *Implementation:* Using latest stable version (15.3.2) with TypeScript and App Router for modern React features.
- **Styling:** Tailwind CSS v4.1.6
  - *Justification:* A utility-first CSS framework that allows for rapid UI development, high customizability, and efficient styling with good performance.
  - *Implementation:* Using latest stable version (4.1.6) with PostCSS integration via `@tailwindcss/postcss`.
- **Version Control:** GitHub
  - *Justification:* Industry standard for version control, facilitating collaboration and CI/CD integration (e.g., with GitHub Actions).

## Backend & Data Management
- **Headless CMS (Choice TBD during setup):**
    - Option 1: Strapi Community Edition (self-hosted)
    - Option 2: Sanity (free tier available)
  - *Justification:* Decouples content management from the presentation layer, providing an API-first approach and flexibility for content creators. The choice will depend on specific feature needs and hosting preferences explored during the CMS setup task.
- **User & Auth Database (Choice TBD during setup):**
    - Option 1: MongoDB Atlas (free tier cluster)
    - Option 2: ElephantSQL (free plan for PostgreSQL)
  - *Justification:* Both offer scalable database solutions with robust free tiers suitable for initial development and MVP. The choice will depend on data modeling preferences and any specific query needs.

## Key Integrations & Services
- **Mapping:** Leaflet.js v1.9.4 + OpenStreetMap tile services
  - *Justification:* Open-source, lightweight, and avoids restrictive API key limits or costs, which is crucial for a directory service with map features.
  - *Implementation:* Using stable version 1.9.4 for reliable mapping functionality.
- **Deployment & Hosting:** Vercel (Hobby free tier)
  - *Justification:* Offers excellent native support for Next.js, integrated CI/CD, serverless functions, global CDN, and a generous free tier for initial deployment.
- **Payments:** Stripe
  - *Justification:* Developer-friendly APIs, secure payment processing, pay-as-you-go pricing model, and widely trusted for online transactions.
- **Authentication (Choice TBD during setup):**
    - Option 1: NextAuth.js (open-source)
    - Option 2: Auth0 (free tier)
  - *Justification:* Both provide robust authentication solutions, including social logins and role-based access control. NextAuth.js is often preferred for its tight integration with Next.js if self-hosting authentication logic is acceptable.
- **Analytics:** Google Analytics
  - *Justification:* Free, comprehensive web analytics service for tracking user behavior, traffic sources, and conversion goals.
- **Email Notifications (Choice TBD during setup):**
    - Option 1: Mailgun (free tier)
    - Option 2: SendGrid (free tier)
  - *Justification:* Reliable email delivery services for transactional emails (e.g., user registration, notifications) with available free tiers.

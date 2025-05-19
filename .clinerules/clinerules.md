##Note to Cline##
You must 

# Project Structure

🛠️ Tech Stack

Next.js 14+ (App Router) for full-stack rendering and API routes (open-source, free)

Tailwind CSS for rapid, utility-first styling (open-source, free)

Strapi CE (self-hosted) or Sanity (free tier) for headless CMS

MongoDB Atlas free cluster (or ElephantSQL free plan) for user & auth data

Leaflet.js + OpenStreetMap for map integration (open-source, no API fees)

Vercel Hobby tier (alternatively Cloudflare Pages/Workers free tier) for deployment

Stripe for payments (pay-as-you-go, no monthly fee)

GitHub for version control & CI

NextAuth.js (open-source) or Auth0 free tier for authentication & role-based access

🗂️ Folder Structure

📂 /src
  /app                # Next.js App Router (e.g., layout.tsx, page.tsx)
  /components         # Reusable React components
  /cms                # Strapi/Sanity schemas & helpers
  /lib                # Utility functions (e.g., SEO helpers, db adapters)
  /api                # Route handlers (e.g., /api/listings, /api/contact)
  /styles             # Tailwind config & global styles
  /hooks              # Custom React hooks
  /types              # TypeScript types & interfaces
📂 /public               # Static assets (images, icons)
📂 /scripts              # Migration or seed scripts
📂 /memory-bank          # Cline Memory Bank/Project Context folder
📂 /.clinerules           # Cline configuration folder
📂 /.github               # GitHub Copilot configuration folder (Cline can IGNORE this.)
📂 /.env.example          # Sample environment variables

🌐 Backend / API Route Conventions

REST-like endpoints under /src/app/api/*:

GET /api/listings – list filtered listings

POST /api/listings – create (auth required, premium only)

GET /api/listings/[slug] – fetch detail

POST /api/reviews – add review (auth required)

GET /api/events – upcoming events feed

Handlers connect to CMS or DB via lightweight wrappers

All responses use JSON with standard success/error envelopes

🚀 Development Workflow

Branching: Feature branches → PR → main

CI: GitHub Actions runs lint, type-check, and tests on every PR

Deploy: Merge to main triggers Vercel preview → prod

CMS: Strapi/Sanity deployed via Vercel Functions/Edge or self-hosted on Render free tier

Compile Check: After file edits (especially syntax/imports), check server terminal for compile errors before browser testing.

Content Editors: Admin UI behind auth; role-based permissions for editors vs. venue owners

User Testing: Monthly usability sessions; analytics dashboards drive roadmap decisions

---

description: Custom instructions adapted from GitHub Copilot guidelines to govern Cline’s behavior and workflows
author: Itthiphum Lenavat
version: 1.0
tags: \["copilot", "workflow", "memory", "navigation"]
globs: \["\*\*/copilot-instructions.md"]
----------------------------------------

# 📋 GitHub Copilot–Style Custom Instructions for Cline

## 🎯 Objective

Provide Cline with structured guidance—modeled on GitHub Copilot’s best practices—so it can assist seamlessly in navigating the project, managing tasks, adhering to tech-stack conventions, and maintaining user memory.

## 🗂️ 1. Project Structure & Task Management

* ✅ **Task Tracking**

  * Mark subtasks complete when finished.
  * Update parent-task status once all subtasks are done.

* 🗄️ **Directory Layout**

  ```
  sustainable-eco-friendly-digital-nomads-directory/
  ├─ app-scaffold/        # Next.js front-end
  ├─ sanity/              # Sanity Studio (CMS)
  └─ app-scaffold/src/
     └─ components/       # React components
  ```

## 🚀 2. Directory Navigation (PowerShell 7)

* Use `Set-Location` instead of `cd`.
* Validate with `Test-Path` before moving.
* Example:

  ```powershell
  # Go to project root
  Set-Location -Path "D:\Eiat_Folder\MyProjects\...\sustainable-eco-friendly-digital-nomads-directory"

  # Into Next.js folder
  Set-Location -Path ".\app-scaffold"

  # Into Sanity studio
  Set-Location -Path "..\sanity"

  # Into components
  Set-Location -Path ".\app-scaffold\src\components"
  ```

## 🛠️ 3. Tech Stack Conventions

* **Front-end:** Next.js 14+ (App Router), Tailwind CSS
* **CMS:** Sanity (free tier)
* **Database:** MongoDB Atlas or ElephantSQL
* **Maps:** Leaflet.js + OpenStreetMap
* **Auth:** NextAuth.js or Auth0
* **Deployment:** Vercel (Hobby) or Cloudflare Pages
* **CI/CD:** GitHub Actions (lint, type-check, tests → preview → production)

## 🌐 4. API & Routing Patterns

* **REST endpoints** under `app-scaffold/src/app/api`:

  ```
  GET    /api/listings
  POST   /api/listings
  GET    /api/listings/[slug]
  PUT    /api/listings/[slug]
  DELETE /api/listings/[slug]
  ```
* **Response envelope**:

  ```json
  {
    "success": true|false,
    "data": {…},
    "error": { code, message }
  }
  ```

## 🔄 5. Development Workflow

1. **Branching:** feature/\* → pull request → main
2. **CI:** run lint, type-check, tests on every PR
3. **Merge:** → Vercel preview → production
4. **CMS updates:** commit to Sanity Studio → auto-deploy
5. **User testing:** monthly sessions → backlog refinement

## 🔒 6. Security & Environment

* **Secrets:** Vercel/Cloudflare env vars
* **Headers:** enforce HTTPS, CSP, CORS via Next.js middleware
* **Rate limiting:** middleware or Cloudflare Turnstile on critical routes
* **Backups:** nightly CMS & DB snapshots (free-tier limits)

## 📦 7. Dependencies & Versioning

* **Lock** security-critical libraries to fixed versions
* **Audit** regularly with `npm audit`
* **Key versions:**

  * Next.js `^14.2.28`
  * NextAuth.js `^4.24.5`
  * `@auth/mongodb-adapter` `^2.0.0`
  * Sanity client/image URL `^6.x`

## 🧠 8. Memory Management

### 👤 8.1 Identify

* Assume you’re interacting with **Eiat**; if unsure, ask.

### 📥 8.2 Load

* On session start, print:

  ```
  Remembering…
  ```
* Retrieve all relevant facts from memory graph.

### 🔍 8.3 Gather

Be alert for new data:

* **Identity:** age, location, role
* **Preferences:** language, style
* **Projects:** repo names, tech choices
* **Goals:** deliverables, timelines

### ♻️ 8.4 Update

When new info arises:

1. Create nodes for recurring entities.
2. Link them to the user.
3. Store each fact as an observation.

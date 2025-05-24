---

description: Custom instructions adapted from Cline guidelines to govern Cline’s behavior and workflows
author: Itthiphum Lenavat
version: 1.0
tags: \["cline", "workflow", "memory", "navigation"]
globs: \["\*\*/clinerules.md"]
----------------------------------------

# 📋 Cline Custom Instructions

## 🎯 Objective

Provide Cline with structured guidance modeled on Cline’s best practices. This guidance will help it assist seamlessly in navigating the project. It will also ensure effective task management. Additionally, it promotes adherence to tech-stack conventions and supports the maintenance of user memory.

## 🗂️ 1. Project Structure & Task Management

* ✅ **Task Tracking**

  * Mark subtasks complete when finished.
  * Update parent-task status once all subtasks are done.

* 🗄️ **Directory Layout**

  ```
  sustainable-eco-friendly-digital-nomads-directory/  # Root directory for the project
  ├─ app-next-directory/                                   # Next.js front-end application
  ├─ sanity/                                         # Sanity Studio for CMS management
  └─ app-next-directory/src/                               # Source folder for the front-end
     └─ components/                                  # React components for UI
  ```

## 🚀 2. Directory Navigation (PowerShell 7)

* Refer to the project guidelines for using `Set-Location` instead of `cd`. `Set-Location` is preferred because it is a full cmdlet in PowerShell, offering better error handling, path validation, and compatibility with scripts compared to the `cd` alias.
* Validate with `Test-Path` before moving.
* Example:

  ```powershell
  # Go to project root
  Set-Location -Path "D:\Eiat_Folder\MyProjects\...\sustainable-eco-friendly-digital-nomads-directory"

  # Into Next.js folder
  Set-Location -Path ".\app-next-directory"

  # Into Sanity studio
  Set-Location -Path "..\sanity"

  # Into components
  Set-Location -Path ".\app-next-directory\src\components"
  ```

## 🛠️ 3. Tech Stack Conventions

* **Front-end:** Next.js ^14.2.28 (App Router), Tailwind CSS ^3.3.2
* **CMS:** Sanity (free tier)
* **Database:** MongoDB Atlas or ElephantSQL
* **Maps:** Leaflet.js + OpenStreetMap
* **Auth:** NextAuth.js or Auth0
* **Deployment:** Vercel (Hobby) or Cloudflare Pages
* **CI/CD:**  Actions (lint, type-check, tests → preview → production)

## 🌐 4. API & Routing Patterns

* **REST endpoints** under `app-next-directory/src/app/api`:

  ```
  GET    /api/listings
  POST   /api/listings
  GET    /api/listings/[slug]
  PUT    /api/listings/[slug]
  DELETE /api/listings/[slug]
  POST   /api/reviews
  GET    /api/reviews/listing/[slug]
  GET    /api/auth/session
  POST   /api/auth/signup
  ```

* **Response envelope**:

  ```json
  {
    "success": true|false,
    "data": {…},
    "error": {
      "code": "string", // Possible values: "INVALID_INPUT", "NOT_FOUND", "UNAUTHORIZED", "SERVER_ERROR"
      "message": "string" // Descriptive error message, e.g., "Invalid input provided", "Resource not found"
    }
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
* **Lock** dependencies to fixed versions
* **Pin** security-critical libraries to exact versions
## 📦 7. Dependencies & Versioning

* **Lock** security-critical libraries to fixed versions
* **Audit** regularly with `npm audit`
* **Key versions:**

  * Next.js `^14.2.28`
  * NextAuth.js `^4.24.5`
  * `@auth/mongodb-adapter` `^2.0.0`
  * Sanity client/image URL `^6.x`

```markdown
🧠 8. Memory Management
=======================

👤 8.1 Identify

### 📥 8.2 Load

* On session start, print:

  ```
  Remembering…
  ```
* Retrieve all relevant facts from memory graph.

  **Example:**
  - If the user mentions a new project, store the project name, description, and associated technologies.
  - Link the project to the user in the memory graph for future reference.

### 🔍 8.3 Gather

Be alert for new data:

* **Identity:** age, location, role
  - Example: If the user mentions their location, store it as a node labeled "Location" and link it to the user.
* **Preferences:** language, style
  - Example: If the user prefers concise responses, store this preference and adjust communication style accordingly.
* **Projects:** repo names, tech choices
  - Example: If the user shares a repository name, create a node for the repository and link it to the user with details like tech stack and purpose.
* **Goals:** deliverables, timelines
  - Example: If the user specifies a deadline, store it as a "Goal" node and associate it with the relevant project.

### ♻️ 8.4 Update

When new info arises:

1. Create nodes for recurring entities.
2. Link them to the user.
3. Store each fact as an observation.

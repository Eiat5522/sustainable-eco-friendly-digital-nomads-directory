# 📦 **Project Structure** 🚀

---

## 📑 **Note for Copilot**

- **Memory Management**: Use the provided memory management guidelines to retrieve, confirm, and update information about the user and projects.
- **Task Management**: Follow the task management system to track progress, update task statuses, and ensure subtasks are completed.
- **Change Directory**: Use PowerShell's `Set-Location` cmdlet to change directories in the terminal. For example, `Set-Location -Path "src\components"` to navigate to the components directory.
- **Tech Stack**: Familiarize yourself with the tech stack used in the project, including Next.js, Tailwind CSS, Sanity, MongoDB, Leaflet.js, Vercel, Stripe, and NextAuth.js.
  []: # 📂
  []: # ├── app-next-directory # Next.js app root
  []: # │ ├── src # Source code
  []: # │ ├── public # Static assets
  []: # │ ├── package.json # App dependencies
  []: # │ └── ...
  []: # └── sanity # Sanity Studio root
  []: # ├── schemas # Custom schema definitions
  []: # ├── sanity.config.js # Main Sanity configuration
  []: # └── ...
  []: # ```

## 📑 **Directory Navigation with PowerShell 7**

- **Change Directory Best Practices:**

  - Use full paths with proper PowerShell cmdlets
  - Examples:

    ```powershell
    # Navigate to project root
    Set-Location -Path "d:\Eiat_Folder\MyProjects\MyOtherProjects\sustainable-eco-friendly-digital-nomads-directory"
    # Navigate to Next.js directory
    Set-Location -Path "d:\Eiat_Folder\MyProjects\MyOtherProjects\sustainable-eco-friendly-digital-nomads-directory\app-next-directory"
    # Navigate to Sanity directory
    Set-Location -Path "d:\Eiat_Folder\MyProjects\MyOtherProjects\sustainable-eco-friendly-digital-nomads-directory\sanity"
    # Navigate to components directory
    Set-Location -Path (Join-Path $PWD "src\components")
    # Navigate up directories
    Set-Location -Path ".."

    # Store and validate paths
    $componentPath = Join-Path $PWD "src\components"
    if (Test-Path $componentPath) {
        Set-Location -Path $componentPath
    }
    ```

  - Always use `Set-Location` instead of `cd` alias
  - Validate paths before navigation
  - Handle spaces and special characters properly
  - Use `Push-Location`/`Pop-Location` for temporary navigation

## 🛠️ **Tech Stack**

- **Full-stack Rendering & API Routes:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS
- **Headless CMS:** Sanity (free tier)
- **Database (User & Auth Data):** MongoDB Atlas free cluster or ElephantSQL free plan
- **Map Integration:** Leaflet.js + OpenStreetMap
- **Deployment:** Vercel Hobby tier or Cloudflare Pages/Workers free tier
  (📌 \_SustainableDigitalNomadsDirectory config also mentions Vercel)
- **Payment Processing:** Stripe (pay-as-you-go)
- **Authentication & Role-Based Access:** NextAuth.js or Auth0 free tier
- **Version Control & CI:** GitHub

## 🌐 **Backend / API Route Conventions**

- **Endpoint Structure:** REST-like endpoints under `/src/app/api/*`
  (📌 _SustainableDigitalNomadsDirectory also uses `app-next-directory/src/app` for Next.js API Routes_)

- **Examples:**

  - `GET /api/listings` – list filtered listings
  - `POST /api/listings` – create (auth required, premium only)
  - `GET /api/listings/[slug]` – fetch detail
  - `PUT /api/listings/[slug]` – update listing (auth required, owner only)
  - `DELETE /api/listings/[slug]` – delete listing (auth required, owner only)
  - `POST /api/reviews` – add review (no auth required)
  - `GET /api/reviews/listing/[slug]` – get all reviews for a listing
  - `GET /api/Blog` – blog feed
  - `GET /api/Blog/[slug]` – blog post detail
  - `GET /api/events` – upcoming events feed
  - `GET /api/auth/session` – get current session data
  - `POST /api/auth/signup` – register new user
  - `POST /api/user/favorites` – save listing to favorites
  - `GET /api/user/favorites` – get user's saved listings
  - `POST /api/payment/create-checkout` – initiate payment process
  - `GET /api/search` – advanced search with filters

- **Response Format:** All responses use JSON with standard success/error envelopes.

---

## ⚡ **Development Workflow**

1. **Branching:** Use Feature branches, merged into `main` via Pull Requests (PRs).
   (📌 _SustainableDigitalNomadsDirectory also uses GitHub branches and pull requests_)
2. **CI:** GitHub Actions runs linting, type-checking, and tests on every PR.
3. **Deployment:** Merging to `main` triggers Vercel preview → production deployment.
   (📌 _SustainableDigitalNomadsDirectory backend deployments via Vercel are triggered automatically on merge to `main`_)
4. **CMS Deployment:** Sanity deployed via Sanity Studio.
   (📌 _SustainableDigitalNomadsDirectory uses Sanity Studio for CMS deployment_)
5. **Content Editors:** Admin UI is placed behind authentication; role-based permissions are used for editors vs. venue owners.
6. **User Testing:** Monthly usability sessions; analytics dashboards drive roadmap decisions.
7. **(SustainableDigitalNomadsDirectory Specific):**

   - Copilot assists with code scaffolding, reviews, and documentation.
   - Next.js 14+ with App Router for full-stack rendering and API routes.
   - Tailwind CSS for styling.
   - Sanity as a headless CMS for content management.
   - MongoDB Atlas for user and auth data.
   - Leaflet.js + OpenStreetMap for map integration.
   - Vercel Hobby tier for deployment.
   - Regular code reviews and documentation updates maintained with Copilot.

## 🔒 **Security & Environment Management**

- **Secrets Management:** Store all secrets (DB URI, Stripe key) securely in Vercel or Cloudflare environment configuration.
  (📌 _SustainableDigitalNomadsDirectory config stores API keys securely in environment variables on Vercel or Railway_)

- **Secure Headers:** Enforce HTTPS and secure headers using middleware in Next.js.

- **Rate Limiting:** Implement rate-limiting on critical endpoints using middleware or Cloudflare Turnstile.

- **Backups:** Nightly backups of CMS & database via provider-level snapshots (within free-tier limits).

- **Environment Configuration:** Use Vercel or Cloudflare environment configuration for secrets.
  (📌 _SustainableDigitalNomadsDirectory uses Vercel or Railway_)

---

## 🔒 **Dependencies & Security**

- **Next.js Version:** 14.2.28 (Security patched version)
- **Authentication:**
  - NextAuth.js (^4.24.5)
  - @auth/mongodb-adapter (2.0.0 - Stable version)
- **Database:** MongoDB (^6.3.0)
- **CMS Integration:**
  - @sanity/client (^6.12.3)
  - @sanity/image-url (^1.0.2)

### Security Best Practices

- Always use exact versions for security-critical packages
- Regular security audits with `npm audit`
- Keep Next.js updated to latest security-patched version
- Use stable versions of authentication adapters
- Implement proper CORS and CSP headers
- Regular dependency updates for security patches

# 🤖 GitHub Copilot Custom Instruction: Memory Management

Use this guide to configure Copilot’s “memory” behavior across sessions.

---

## 1️⃣ User Identification 👤

- **Assume** you are interacting with **Eiat**
- If **Eiat** is not yet known, **proactively** determine their identity

---

## 2️⃣ Memory Retrieval and Confirmation 🧠

- **Begin each session** by printing only:

```

Remembering...

```

- **Retrieve** all relevant information from your knowledge graph
- **Confirm** the accuracy of the retrieved information with the user
- **Ask** if the user wants to add or update any information
- **Reassurance** "I will remember this information for future conversations."
- **Confirmation** "When the user asks for memory confirmation i.e. Do you remember","Remember?", I will provide it based on my memory."
- **Use** the following format for confirming information:

```
- Always refer to your knowledge graph as your **“memory”**

---

## 3️⃣ Memory Gathering 📋

User Awareness
Be attentive to any new information about Eiat in these categories:

- **Basic Identity**: age, gender, location, job title, education level
- **Behaviors**: interests, habits
- **Preferences**: communication style, preferred language
- **Goals**: objectives, targets, aspirations
- **Relationships**: personal & professional (up to 3° of separation)
- **Contextual Information**: relevant to the current conversation
- **Past Interactions**: previous conversations, decisions made, actions taken

Project Awareness
Be attentive to any new information about any projects you are a part of in these categories:

- **Project Names**: titles of current and past projects
- **Technologies Used**: frameworks, languages, and tools employed
- **Project Goals**: objectives and desired outcomes
- **Team Members**: individuals involved in each project
- **Project Status**: current progress and any blockers

---

## 4️⃣ Memory Update 🔄

# User Contextual
When new information about Eiat is provided:

When new facts appear during conversation:

1. **Create** entities for recurring organizations, people, or events
2. **Link** them to existing nodes with appropriate relations
3. **Store** each fact as an observation in your memory graph

**Example:**

- If a user mentions a new project, create a node for it and link it to the user
- Store the project details as an observation

# Project's Contextual
When new information about projects is provided:
1. **Create** entities for new projects, technologies, or team members
2. **Link** them to existing nodes with appropriate relations
3. **Store** each fact as an observation in your memory graph
**Example:**
- If a user mentions a new project, create a node for it and link it to the user
- Store the project details as an observation
- If a user mentions a new technology, create a node for it and link it to the relevant project
- Store the technology details as an observation
- If a user mentions a new team member, create a node for them and link it to the relevant project
- Store the team member details as an observation
---
## 5️⃣ Memory Management 🗃

- Regularly review and clean up memory graph to remove outdated or irrelevant information
- Implement versioning for key entities to track changes over time
- Use timestamps to manage the lifecycle of observations
- Provide users with the ability to update or delete their information
- Ensure compliance with data privacy regulations

# Copilot Instructions for Sustainable Digital Nomads Directory
## Overview
This document provides detailed instructions for GitHub Copilot to assist in the development of the Sustainable Digital Nomads Directory project. It includes guidelines for memory management, task management, and directory navigation using PowerShell 7.
## Memory Management
### Memory Retrieval and Confirmation
- Begin each session by printing "Remembering..." to indicate memory retrieval.
- Retrieve all relevant information from your knowledge graph
- Confirm the accuracy of the retrieved information with the user
- Ask if the user wants to add or update any information
- Reassurance "I will remember this information for future conversations."
- Confirmation "When the user asks for memory confirmation i.e. Do you remember","Remember?", I will provide it based on my memory."
- Use the following format for confirming information:

```

- Always refer to your knowledge graph as your **“memory”**
- Confirm the information with the user

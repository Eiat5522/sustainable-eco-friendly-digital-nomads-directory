# 📦 **Project Structure** 🚀

---
## 📑 **Note for Copilot**
* **Change Directory 'cd' cmdlet**: Use the 'cd' command to change directories in the terminal. For example, `cd src/components` to navigate to the components directory.
* **Project Context**: When starting a new session. You must Load your context with information from all the files in the "d:\Eiat_Folder\MyProjects\MyOtherProjects\sustainable-eco-friendly-digital-nomads-directory\tasks" folder.
* **Subtask Completion**: You must (Without fail) update subtask status once you have completely finished the corresponding Subtask.

## 📑 **Directory Navigation with PowerShell 7**
* **Change Directory Best Practices:**
  * Use full paths with proper PowerShell cmdlets
  * Examples:
    ```powershell
    # Navigate to project root
    Set-Location -Path "d:\Eiat_Folder\MyProjects\MyOtherProjects\sustainable-eco-friendly-digital-nomads-directory"
    
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
  * Always use `Set-Location` instead of `cd` alias
  * Validate paths before navigation
  * Handle spaces and special characters properly
  * Use `Push-Location`/`Pop-Location` for temporary navigation
  
## 🛠️ **Tech Stack**

* **Full-stack Rendering & API Routes:** Next.js 14+ (App Router)
* **Styling:** Tailwind CSS
* **Headless CMS:** Strapi CE (self-hosted) or Sanity (free tier)
* **Database (User & Auth Data):** MongoDB Atlas free cluster or ElephantSQL free plan
* **Map Integration:** Leaflet.js + OpenStreetMap
* **Deployment:** Vercel Hobby tier or Cloudflare Pages/Workers free tier
  (📌 *SustainableDigitalNomadsDirectory config also mentions Vercel or Railway for backend deployment*)
* **Payment Processing:** Stripe (pay-as-you-go)
* **Authentication & Role-Based Access:** NextAuth.js or Auth0 free tier
* **Version Control & CI:** GitHub
* **(SustainableDigitalNomadsDirectory Specific Tech):**

  * React Native (Expo Bare) for Mobile App
  * Google Gemini for AI-generated responses


## 🌐 **Backend / API Route Conventions**

* **Endpoint Structure:** REST-like endpoints under `/src/app/api/*`
  (📌 *SustainableDigitalNomadsDirectory also uses `/src/app` for Next.js API Routes*)

* **Examples (from `clinerules.md`):**

  * `GET /api/listings` – list filtered listings
  * `POST /api/listings` – create (auth required, premium only)
  * `GET /api/listings/[slug]` – fetch detail
  * `POST /api/reviews` – add review (auth required)
  * `GET /api/events` – upcoming events feed

* **Data Handling:** Handlers connect to CMS or DB via lightweight wrappers
  (📌 *SustainableDigitalNomadsDirectory API routes proxy requests securely to Google Gemini*)

* **Response Format:** All responses use JSON with standard success/error envelopes.

---

## ⚡ **Development Workflow**

1. **Branching:** Use Feature branches, merged into `main` via Pull Requests (PRs).
   (📌 *SustainableDigitalNomadsDirectory also uses GitHub branches and pull requests*)
2. **CI:** GitHub Actions runs linting, type-checking, and tests on every PR.
3. **Deployment:** Merging to `main` triggers Vercel preview → production deployment.
   (📌 *SustainableDigitalNomadsDirectory backend deployments via Vercel or Railway are triggered automatically on merge to `main`*)
4. **CMS Deployment (`clinerules.md`):** Strapi/Sanity deployed via Vercel Functions/Edge or self-hosted on Render free tier.
5. **Content Editors (`clinerules.md`):** Admin UI is placed behind authentication; role-based permissions are used for editors vs. venue owners.
6. **User Testing (`clinerules.md`):** Monthly usability sessions; analytics dashboards drive roadmap decisions.
7. **(SustainableDigitalNomadsDirectory Specific):**

   * Copilot assists with code scaffolding, reviews, and documentation.
   * React Native mobile builds via EAS Build from Expo.
   * Regular code reviews and documentation updates maintained with Copilot.



## 🔒 **Security & Environment Management**

* **Secrets Management:** Store all secrets (DB URI, Stripe key) securely in Vercel or Cloudflare environment configuration.
  (📌 *SustainableDigitalNomadsDirectory config stores API keys securely in environment variables on Vercel or Railway*)

* **Secure Headers:** Enforce HTTPS and secure headers using middleware in Next.js.

* **Rate Limiting:** Implement rate-limiting on critical endpoints using middleware or Cloudflare Turnstile.

* **Backups:** Nightly backups of CMS & database via provider-level snapshots (within free-tier limits).

* **Environment Configuration:** Use Vercel or Cloudflare environment configuration for secrets.
  (📌 *SustainableDigitalNomadsDirectory uses Vercel or Railway*)

---

## 🔒 **Dependencies & Security**

* **Next.js Version:** 14.2.28 (Security patched version)
* **Authentication:** 
  * NextAuth.js (^4.24.5)
  * @auth/mongodb-adapter (2.0.0 - Stable version)
* **Database:** MongoDB (^6.3.0)
* **CMS Integration:** 
  * @sanity/client (^6.12.3)
  * @sanity/image-url (^1.0.2)

### Security Best Practices
* Always use exact versions for security-critical packages
* Regular security audits with `npm audit`
* Keep Next.js updated to latest security-patched version
* Use stable versions of authentication adapters
* Implement proper CORS and CSP headers
* Regular dependency updates for security patches

## 🧠 **Memory Bank**

* **Purpose:** Preserve critical project context, decisions, and technical considerations throughout the development process
* **Location:** Memory Bank content is maintained in `.clinerules/memory-bank.md`
* **What to Store:**
  * Key architectural decisions and their rationales
  * Technical constraints and chosen workarounds
  * Third-party integration specifics
  * Design patterns established for consistency
  * Performance optimization strategies
* **Maintenance Process:**
  * Update after significant technical decisions
  * Reference in PR descriptions when applicable
  * Review and prune quarterly to keep relevant
* **Usage Guidelines:** 
  * Keep entries concise and dated
  * Link to relevant issues/PRs for context
  * Organize by domain (frontend, backend, infrastructure)

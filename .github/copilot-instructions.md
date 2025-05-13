# 📦 **Project Structure** 🚀

## 🛠️ **Tech Stack**

* **Full-stack Rendering & API Routes:** Next.js 14+ (App Router)
* **Styling:** Tailwind CSS
* **Headless CMS:** Strapi CE (self-hosted) or Sanity (free tier)
* **Database (User & Auth Data):** MongoDB Atlas free cluster or ElephantSQL free plan
* **Map Integration:** Leaflet.js + OpenStreetMap
* **Deployment:** Vercel Hobby tier or Cloudflare Pages/Workers free tier
  (📌 *KhaRom config also mentions Vercel or Railway for backend deployment*)
* **Payment Processing:** Stripe (pay-as-you-go)
* **Authentication & Role-Based Access:** NextAuth.js or Auth0 free tier
* **Version Control & CI:** GitHub
* **(KhaRom Specific Tech):**

  * React Native (Expo Bare) for Mobile App
  * Google Gemini for AI-generated responses

---

## 🌐 **Backend / API Route Conventions**

* **Endpoint Structure:** REST-like endpoints under `/src/app/api/*`
  (📌 *KhaRom also uses `/src/app` for Next.js API Routes*)

* **Examples (from `clinerules.md`):**

  * `GET /api/listings` – list filtered listings
  * `POST /api/listings` – create (auth required, premium only)
  * `GET /api/listings/[slug]` – fetch detail
  * `POST /api/reviews` – add review (auth required)
  * `GET /api/events` – upcoming events feed

* **Data Handling:** Handlers connect to CMS or DB via lightweight wrappers
  (📌 *KhaRom API routes proxy requests securely to Google Gemini*)

* **Response Format:** All responses use JSON with standard success/error envelopes.

* **(KhaRom Specific Endpoint):** Example: `/api/chat`

---

## ⚡ **Development Workflow**

1. **Branching:** Use Feature branches, merged into `main` via Pull Requests (PRs).
   (📌 *KhaRom also uses GitHub branches and pull requests*)
2. **CI:** GitHub Actions runs linting, type-checking, and tests on every PR.
3. **Deployment:** Merging to `main` triggers Vercel preview → production deployment.
   (📌 *KhaRom backend deployments via Vercel or Railway are triggered automatically on merge to `main`*)
4. **CMS Deployment (`clinerules.md`):** Strapi/Sanity deployed via Vercel Functions/Edge or self-hosted on Render free tier.
5. **Content Editors (`clinerules.md`):** Admin UI is placed behind authentication; role-based permissions are used for editors vs. venue owners.
6. **User Testing (`clinerules.md`):** Monthly usability sessions; analytics dashboards drive roadmap decisions.
7. **(KhaRom Specific):**

   * Cline assists with code scaffolding, reviews, and documentation.
   * React Native mobile builds via EAS Build from Expo.
   * Regular code reviews and documentation updates maintained with Cline.

---

## 🔒 **Security & Environment Management**

* **Secrets Management:** Store all secrets (DB URI, Stripe key) securely in Vercel or Cloudflare environment configuration.
  (📌 *KhaRom config stores API keys securely in environment variables on Vercel or Railway*)

* **Secure Headers:** Enforce HTTPS and secure headers using middleware in Next.js.

* **Rate Limiting:** Implement rate-limiting on critical endpoints using middleware or Cloudflare Turnstile.

* **Backups:** Nightly backups of CMS & database via provider-level snapshots (within free-tier limits).

* **Environment Configuration:** Use Vercel or Cloudflare environment configuration for secrets.
  (📌 *KhaRom uses Vercel or Railway*)

---

## 🧠 **Memory Bank** (From KhaRom Configuration)

* Instructions for Project memory usage are stored in `memory-bank.md`.
* The purpose of the Memory Bank is to preserve important context and decisions through the conversation history.

# Agents

## Project-specific Notes

- **Tech stack:** Next.js 14+ (App Router), Tailwind CSS, Sanity, MongoDB Atlas, Leaflet.js, Vercel, Stripe, NextAuth.js.
- **Monorepo structure:**
  - `app-next-directory/` – Next.js app
  - `sanity/` – Sanity Studio
- **Start scripts:**
  - Next.js: `pnpm --filter ./app-next-directory dev`
  - Sanity: `pnpm --filter ./sanity dev`
- **Environment variables:** Store secrets in Vercel/Cloudflare environment config.
- **Security:** Use exact versions for critical packages, regular `npm audit`, and keep Next.js updated.
- **Testing:** Use Playwright for E2E, Vitest/Jest for unit tests.
- **Content editing:** Sanity Studio is used for CMS, with role-based access.
- **Deployment:** Merging to `main` triggers Vercel deployment.

---

## Sanity CLI Proxy Configuration (Windows/PowerShell)

If you need to run the Sanity CLI behind an HTTP proxy (for example, when working in a restricted or remote environment), use the provided PowerShell script to ensure all network requests go through the proxy:

1. Install the `global-agent` package in your project:

   ```powershell
   pnpm add global-agent
   ```

2. Use the `run-sanity-proxy.ps1` script in the project root. This script sets the `GLOBAL_AGENT_HTTP_PROXY` environment variable and runs the Sanity CLI with the required bootstrap:

   ```powershell
   .\run-sanity-proxy.ps1 <sanity-command>
   # Example:
   .\run-sanity-proxy.ps1 start
   ```

   The proxy address is hardcoded as `http://proxy:8080` in the script. Edit the script if you need to change it.
3. For normal (no-proxy) local development, simply run the Sanity CLI as usual (e.g., `pnpm sanity start`).

This setup ensures proxy usage is persistent only when needed and does not affect your local workflow

---

For more details, see the `README.md` and `WORKSPACE_SETUP.md` in the project root.

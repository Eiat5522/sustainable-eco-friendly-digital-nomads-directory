---
applyTo: "**"
---

# Sustainable Digital Nomads Directory – AI Agent Coding Guidelines (Draft)

## 1. Tech Stack & Directory Structure
- **Core Technologies:** Next.js (App Router), Tailwind CSS, Sanity CMS, MongoDB, Leaflet.js, Vercel, Stripe, NextAuth.js.
- **API Routes:** Must follow `/src/app/api/*` structure.
- **Sanity Schemas:** Located in `sanity/schemas/`.
- **Main Document Types:** `listing`, `city`, `blogPost`, `author`, `siteConfig`.

## 2. Working with the Codebase
- **Package Manager:** Use `pnpm` for installing packages and managing dependencies. Always run `pnpm install` and other pnpm commands from the `app-next-directory` folder unless otherwise specified.
- **Dependency Management:** Ensure all dependencies are listed in the relevant `package.json` and installed via pnpm.

## 3. Unit Testing & Parsing
- **Testing Platform:** Use Jest for unit testing. Babel is required as a dependency for parsing and transpiling files to be tested.
- **Test Location:** Place unit tests in the appropriate `tests/` or `app-next-directory/tests/` folder.
- **Test Execution:** Run tests using `pnpm test` or the configured Jest command in the app-next-directory.

## 4. Sanity Schema Conventions
- **Key Listing Fields:** `title`, `slug`, `listingType`, `mainImage`, `address`, `city`, `country`, `website`, `amenities`, `sustainabilityFeatures`, `priceRange`, `rating`, `isFeatured`, `status`, `seo`.
- **Image Fields:** Always include `alt` text and use `hotspot: true` for cropping.
- **Validation:** Use Sanity's validation API (e.g., `Rule.required()`) for data integrity.

## 5. Directory Navigation
- Use PowerShell’s `Set-Location` with absolute paths and capitalized drive letters (e.g., `Set-Location -Path "D:\Eiat_Folder\MyProjects\MyOtherProjects\sustainable-eco-friendly-digital-nomads-directory"`).
- Never use relative paths or lowercase drive letters.

## 6. Task Management
- Link code changes to known tasks and proactively ask if a solution completes a task or sub-task.
- Confirm workstream completion before marking as complete.

## 7. Code Quality
- Adhere to linting and best practices for TypeScript, Next.js, and Sanity.
- For complex logic, offer to add comments or JSDoc documentation.
- Mark temporary/debug code with `FORTEST:` or `FIXME:` comments.

## 8. Editing & Tooling
- Use desktop-commander tools for file operations.
- For small edits (≤30 lines), use exact content match.
- For large changes, use focused edit blocks.
- Validate files for errors after every change.

## 9. Security
- Use exact versions for critical packages.
- Store secrets in environment configuration (Vercel/Cloudflare).
- Enforce HTTPS, secure headers, and rate limiting.

## 10. Query Clarification
- If a request is ambiguous, ask for clarification before proceeding.

---

*This draft is for review. Please suggest edits or additions as needed before finalizing.*

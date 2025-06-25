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
  * **Rendering Note:** Be mindful of code in `layout.tsx` or other root components that might conditionally prevent children from rendering during Server-Side Rendering (SSR) (e.g., checks like `typeof window === 'undefined'` for main content). Ensure page content is consistently rendered.
* **CMS:** Sanity (free tier)
  * **Image Handling:** When working with Sanity images:
    1. Always inspect the TypeScript interface for the image asset within the specific component.
    2. Determine if the fetched data provides a direct `asset.url` or an `asset._ref`.
    3. Use the `urlFor()` helper (e.g., `urlFor(imageAsset).width(W).height(H).url()`) ONLY when dealing with an asset reference (`_ref`).
    4. If a direct `url` is available in the fetched data, use it directly.
    5. If unsure, and data is fetched client-side, consider temporarily logging the image data structure to confirm.
* **Database:** MongoDB Atlas or ElephantSQL
* **Database:** MongoDB Atlas or ElephantSQL
* **Maps:** Leaflet.js + OpenStreetMap
* **Auth:** NextAuth.js or Auth0
* **Deployment:** Vercel (Hobby) or Cloudflare Pages
  * **CI/CD:**  Actions (lint, type-check, tests → preview → production)
* **Identifier Casing:** Maintain consistent casing for variables, properties, and function names within TypeScript/JavaScript. Prefer `camelCase` for most identifiers (e.g., `primaryImage` not `primary_image`).
  * **PowerShell Profile/Scripting:**
    * **Executable & Script Path Validation:** Before calling external commands or sourcing scripts (especially if paths are dynamic or not guaranteed in `PATH`):
        1. Verify executable existence (e.g., `Test-Path $exePath` or `Get-Command $commandName -ErrorAction SilentlyContinue`).
        2. If an executable provides a script path (e.g., via `--locate-shell-integration-path`), validate this path (`Test-Path $scriptPath -PathType Leaf` and ensure it's not empty) before sourcing.
        3. Provide clear `Write-Warning` or `Write-Error` if validation fails.
    * **User-Driven Refinements:** When user feedback suggests a cleaner, more robust, or more idiomatic way to structure script logic (e.g., using a boolean flag set at the start of a profile), prioritize incorporating such improvements.

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

### 🧪 Testing: Unit vs. Integration Test File Policy

* When both unit and integration test files exist for the same logic (e.g., middleware), each test file **must** include a comment block at the top that:
  - Clearly explains its role (unit vs. integration).
  - References the other test file by name.
  - States why both are needed for full coverage (e.g., differences in mocking vs. real Next.js objects).
  - Optionally includes troubleshooting notes for future maintainers about differences in mocking, polyfilling, or test semantics.
* This ensures clarity for all contributors and prevents confusion about test coverage or intent.
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
  * `@NextAuth/mongodb-adapter` `^2.0.0`
  * Sanity client/image URL `^6.x`

## ⚙️ MCP Server Configuration

* **Workspace-Specific Servers:** For MCP servers that rely on workspace-relative paths (e.g., using `"${workspaceFolder}"` in their arguments), configure them in the project's `.vscode/mcp.json` file. This ensures correct path resolution and keeps project-specific configurations localized.
* **Global Servers:** Servers intended for general use across multiple projects can be configured in the global `cline_mcp_settings.json` file.
* **Default Settings:** When adding new MCP servers, ensure `disabled` is set to `false` and `autoApprove` is initialized (e.g., to `[]`) unless specific auto-approval is intended.
* **Versioning:** When installing MCP servers via `npx`, prefer specifying a version (e.g., `npx -y my-mcp-server@1.2.3`) if a stable version is known or can be easily determined. If not, using the latest version (e.g., `npx -y my-mcp-server`) is acceptable, but consider pinning it to a specific version later for stability.
* **Tool Naming & Casing:** When calling MCP tools, meticulously check the server's documentation for exact tool names, parameter names, and their casing (e.g., `toolName` vs `tool_name`), as these are often case-sensitive and a common source of errors.

```markdown

👤 8.1 Identify

### 📥 8.2 Load

* On session start, or when beginning a new distinct task where context isn't pre-loaded, print:
  ```
  Remembering…
  ```
* **Action:** Read the content of all core Memory Bank files:
  * `memory-bank/projectbrief.md`
  * `memory-bank/productContext.md`
  * `memory-bank/activeContext.md`
  * `memory-bank/systemPatterns.md`
  * `memory-bank/techContext.md`
  * `memory-bank/progress.md`
* Retrieve all relevant facts from the memory graph based on these files and the current task.

  **Example (after loading and processing memory files):**
  - If the user mentions a new project, store the project name, description, and associated technologies.
  - Link the project to the user in the memory graph for future reference.
🧠 8. Memory Management

👤 8.1 Identify

### 📥 8.2 Load

* On session start, or when beginning a new distinct task where context isn't pre-loaded, print:
  ```
  Remembering…
  ```
* **Action:** Read the content of all core Memory Bank files:
  * `memory-bank/projectbrief.md`
  * `memory-bank/productContext.md`
  * `memory-bank/activeContext.md`
  * `memory-bank/systemPatterns.md`
  * `memory-bank/techContext.md`
  * `memory-bank/progress.md`
* In addition to local files, maintain a remotely stored memory using the Open Memory MCP server. All remote memory operations (add, retrieve, list, delete) should use this server.
* When storing any memory (local or remote), always add a current date/time stamp using the Time MCP server. This ensures all memories are timestamped for future reference.
* Retrieve all relevant facts from the memory graph based on these files and the current task.

  **Example (after loading and processing memory files):**
  - If the user mentions a new project, store the project name, description, and associated technologies, along with a timestamp.
  - Link the project to the user in the memory graph for future reference.
=======================

👤 8.1 Identify

### 📥 8.2 Load

* On session start, or when beginning a new distinct task where context isn't pre-loaded, print:
  ```
  Remembering…
  ```
* **Action:** Read the content of all core Memory Bank files:
  * `memory-bank/projectbrief.md`
  * `memory-bank/productContext.md`
  * `memory-bank/activeContext.md`
  * `memory-bank/systemPatterns.md`
  * `memory-bank/techContext.md`
  * `memory-bank/progress.md`
* Retrieve all relevant facts from the memory graph based on these files and the current task.

  **Example (after loading and processing memory files):**
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

## 🖼️ Asset Management

* **Missing Static Assets:** If a static asset (e.g., image, font, document) referenced in the code is found to be missing (e.g., after using `list_files`):
    1. Inform the user about the specific missing asset and its path.
    2. Propose and implement a graceful fallback. This could be:
        * A styled placeholder `div` with descriptive text or an SVG icon.
        * Removing the element if its absence doesn't critically break the UI and a placeholder is unsuitable.
    3. Ask the user if they can provide the asset, if a generic placeholder is acceptable long-term, or if they have other instructions for handling it.

## 📊 Data Consistency & Debugging

* When debugging missing data in UI, always check the data fetching query for completeness and alignment with the CMS schema before making frontend changes.
* When updating Sanity schemas, update GROQ queries and TypeScript types in lockstep.
* Include a troubleshooting checklist for missing/undefined fields in UI: (a) Check CMS schema, (b) Check GROQ query, (c) Check prop types, (d) Check rendering logic.

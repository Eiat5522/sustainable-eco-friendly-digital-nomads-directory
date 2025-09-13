---
applyTo: "**"
---
# 📦 Github Copilot Instructions 🚀

**File: .github/CODEOWNERS**
**Enforce that only @Eiat can modify this instructions file:**
**.github/copilot-instructions.md @Eiat**

## 🌱 Sustainable Digital Nomads Directory – Repository Onboarding & Coding Guidelines

**Purpose**: A curated monorepo platform for sustainable, eco-friendly venues and services for digital nomads worldwide. Features include venue listings, city guides, advanced search, interactive maps, user authentication, and admin dashboard.

### 1. Tech Stack & Architecture
- **Frontend**: Next.js 15+ (App Router), TypeScript, Tailwind CSS v4, Framer Motion, Radix UI
- **Backend/CMS**: Sanity.io CMS, MongoDB Atlas, NextAuth.js v5 (beta)
- **Testing**: Playwright (120+ E2E tests), Jest (unit tests), SWC transpilation
- **Package Management**: pnpm (preferred), npm (fallback)
- **Maps**: Leaflet.js with OpenStreetMap
- **Deployment**: Vercel (frontend), Sanity Cloud (CMS), MongoDB Atlas (database)

### Project Structure
```
sustainable-eco-friendly-digital-nomads-directory/
├── app-next-directory/          # Main Next.js application
│   ├── src/                     # Source code (components, pages, API routes)
│   ├── tests/e2e/               # Playwright test suites (120+ tests)
│   ├── __mocks__/               # Jest mocks for external dependencies
│   ├── jest.config.cjs          # Jest configuration with complex mocking
│   ├── playwright.config.ts     # E2E testing configuration
│   ├── next.config.mjs          # Next.js config with image domains, redirects
│   └── eslint.config.mjs        # ESLint flat config
├── sanity/                      # Sanity CMS configuration
│   ├── schemas/                 # Content type definitions
│   ├── sanity.config.ts         # Studio configuration
│   └── package.json             # Sanity dependencies
├── listings/                    # Data processing & migration (Python scripts)
├── docs/                        # Comprehensive project documentation
├── scripts/                     # Utility scripts (validation, testing, CI)
└── package.json                 # Root workspace configuration (pnpm workspaces)
```

- **API Routes:** Must follow `/src/app/api/*` structure.
- **Sanity Schemas:** Located in `sanity/schemas/`.
- **Main Document Types:** `listing`, `city`, `blogPost`, `author`, `siteConfig`.
- **Key Listing Fields:** `title`, `slug`, `listingType`, `mainImage`, `address`, `city`, `country`, `website`, `amenities`, `sustainabilityFeatures`, `priceRange`, `rating`, `isFeatured`, `status`, `seo`.

### 2. Development Commands & Package Management
- **Package Manager:** Use `pnpm` as the primary package manager (npm fallback available).
- **Monorepo Setup:** Uses pnpm workspaces with two main packages: `app-next-directory` and `sanity`.

#### Essential Commands
```bash
# Root level - Install all dependencies
pnpm install

# Development servers
pnpm dev           # Start Next.js on :3000
pnpm dev:sanity    # Start Sanity Studio on :3333

# Building & Testing
pnpm build         # Build both Next.js and Sanity
pnpm test          # Run Playwright E2E tests (from app-next-directory)
pnpm types:postprocess  # Generate and postprocess Sanity types

# From app-next-directory/ workspace
npm run dev        # Development server
npm run build      # Production build + type generation
npm run test:jest  # Jest unit tests
npm run test:e2e   # Playwright E2E tests
npm run validate:env  # Environment variable validation

# From sanity/ workspace
npm run dev        # Development studio
npm run update-types  # Generate TypeScript types from schemas
```

#### Critical Setup Requirements
- **Environment Variables**: Required `.env.local` in `app-next-directory/` with Sanity, MongoDB, and NextAuth config
- **Pre-commit Hooks**: Husky runs format, type-check, lint automatically
- **TypeScript**: Multiple tsconfig files - use `build:types` before building
- **Testing**: 120+ Playwright E2E tests covering authentication, RBAC, API security

### 3. Testing Strategy & Configuration
- **Testing Framework:** Playwright (E2E) + Jest (unit tests) with comprehensive mocking
- **Coverage:** 120+ E2E test cases covering authentication flows, RBAC, API security
- **Authentication System:** ✅ COMPLETE - NextAuth.js v5 with 5-tier RBAC, MongoDB sessions

#### Test Execution
```bash
# E2E Testing (from app-next-directory/)
npm run test:e2e              # All E2E tests
npm run test:e2e -- --ui      # Interactive test runner
npm run test:e2e -- --headed  # Browser UI visible

# Unit Testing
npm run test:jest             # Jest unit tests with mocks
```

#### Key Test Configuration
- **Playwright Config**: `app-next-directory/playwright.config.ts` - uses :3000, auto-starts dev server
- **Jest Config**: `app-next-directory/jest.config.cjs` - extensive mocking for Next.js/Sanity/MongoDB
- **Mock Files**: `app-next-directory/__mocks__/` - don't modify unless necessary
- **Test Location**: E2E tests in `tests/e2e/`, unit tests follow `*.test.ts` pattern

### 4. Configuration Files & Code Quality
- **ESLint**: Uses flat config (`eslint.config.mjs`) with Next.js rules, warnings rather than errors
- **TypeScript**: Strict mode, multiple tsconfig files for different contexts (server, test, types)
- **Tailwind**: v4 configuration with Radix UI components
- **Next.js**: Complex config in `next.config.mjs` with image domains, redirects, webpack customization

#### Key Configuration Files
- `next.config.mjs`: Image domains (Sanity CDN, Unsplash), redirects, source maps, webpack SVG handling
- `eslint.config.mjs`: Flat config with relaxed rules for development efficiency
- `jest.config.cjs`: Complex mocking setup for Next.js/Sanity integration
- `playwright.config.ts`: E2E testing with auto-server startup
- `tailwind.config.js`: Tailwind v4 with Radix components
- `.husky/pre-commit`: Runs prettier, type-check, lint

#### Sanity Schema Conventions
- **Key Listing Fields:** `title`, `slug`, `listingType`, `mainImage`, `address`, `city`, `country`, `website`, `amenities`, `sustainabilityFeatures`, `priceRange`, `rating`, `isFeatured`, `status`, `seo`.
- **Image Fields:** Always include `alt` text and use `hotspot: true` for cropping.
- **Validation:** Use Sanity's validation API (e.g., `Rule.required()`) for data integrity.

### 5. Directory Navigation (Desktop Commander Requirements)

- Use PowerShell’s `Set-Location` with absolute paths and capitalized drive letters (e.g., `Set-Location -Path "D:\Eiat_Folder\MyProjects\MyOtherProjects\sustainable-eco-friendly-digital-nomads-directory"`).
 - Examples:
    ```powershell
    # Navigate to project root
    Set-Location -Path "D:\Eiat_Folder\MyProjects\MyOtherProjects\sustainable-eco-friendly-digital-nomads-directory"
    # Navigate to Next.js directory
    Set-Location -Path "D:\Eiat_Folder\MyProjects\MyOtherProjects\sustainable-eco-friendly-digital-nomads-directory\app-next-directory"
    # Navigate to Sanity directory
    Set-Location -Path "D:\Eiat_Folder\MyProjects\MyOtherProjects\sustainable-eco-friendly-digital-nomads-directory\sanity"
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

### 6. Environment Setup & Troubleshooting

#### Required Environment Variables
Create `.env.local` in `app-next-directory/`:
```env
# Sanity Configuration
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_api_token

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_32_character_secret

# Optional: OAuth Providers
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

#### Common Issues & Solutions
- **pnpm not found**: Install with `npm install -g pnpm` or use npm as fallback
- **Build failures**: Run `npm run build:types` before building; expect some TypeScript errors (existing codebase)
- **TypeScript errors**: Current codebase has known TS issues - focus on functionality over type perfection
- **Test failures**: Ensure `.env.local` is configured; run `npx playwright install` for browsers
- **ESLint errors**: Rules are mostly warnings - check `eslint.config.mjs` for specifics
- **Sanity types**: Run `cd sanity && npm run update-types` after schema changes
- **Port conflicts**: Next.js uses :3000, Sanity Studio uses :3333
- **Environment validation**: Use `npm run validate:env` to check configuration

#### Monorepo Best Practices
```bash
# Target specific workspaces
pnpm --filter app-next-directory add package-name
pnpm --filter sanity dev

# Check available scripts
pnpm run  # From root
npm run   # From workspace directories
```
- Adhere to linting and best practices for TypeScript, Next.js, and Sanity.
- For complex logic, offer to add comments or JSDoc documentation.
- Mark temporary/debug code with `TODO:` or `FIXME:` comments. Reserve `FORTEST-` for temporary file names only.

### 7. Code Quality
- Use desktop-commander tools for file operations.
- For small edits (≤30 lines), use exact content match.
- For large changes, use focused edit blocks.
- Validate files for errors after every change.

### 8. Editing & Tooling
- Use exact versions and commit pnpm-lock.yaml. Enable automated security updates (Dependabot/Renovate).
- Store secrets in environment configuration (Vercel/Cloudflare).
- Enforce HTTPS, secure headers, and rate limiting.

## 🚀 Quick Onboarding Checklist

### First-Time Setup
1. **Install Dependencies**: `pnpm install` (or `npm install` if pnpm unavailable)
2. **Environment Setup**: Create `.env.local` in `app-next-directory/` with required variables
3. **Validate Environment**: `cd app-next-directory && npm run validate:env`
4. **Build Types**: `cd sanity && npm run update-types` to generate Sanity TypeScript types
5. **Test Setup**: `npx playwright install` for E2E test browsers

### Development Workflow
1. **Start Development**: `pnpm dev` (Next.js) and `pnpm dev:sanity` (Sanity Studio)
2. **Code Quality**: Pre-commit hooks run automatically (format, type-check, lint)
3. **Testing**: Run `npm run test:e2e` for comprehensive testing
4. **Build**: `pnpm build` for production builds

### Key Resources
- **Documentation**: Comprehensive guides in `docs/` folder
- **Examples**: 120+ test cases in `tests/e2e/` demonstrate usage patterns
- **Scripts**: Utility scripts in `scripts/` for validation, testing, CI
- **Configuration**: All config files include comments explaining purpose

---

## 📑 Rules of Conduct

- **Memory Management**: Use the provided memory management guidelines to retrieve, confirm, and update information about the user and projects.
- **Task Management**: Follow the Workstream Documentation {".\\memory-bank\\parallel_workstreams\\*"} to track latest Project's status, Before a Task is to be CONSIDERDED as Completed, Copilot must reassure that the task is actually completed. If the Tasks is UX/UI related. An #MCP Tool #Playwrite or #BrowserTool must be use for confirmation. Only then Copilot must Update Task Status to Complete.
- **Task Policies**: Immediately after a status change, whether from 'Not Started' to 'In Progress' or 'In Progress' to 'Completed'. You must ensure Tasks Statuses are Updated accordingly in Real-Time. Do not report to the User after every status change. Only report back mid Workstream when 1. Copilot is struck and cannot progress. 2. Only if the User explicitely asks for a status update. 3. When the whole Workstream is Completed.
- **Workstream Completeness Confirmation**: In order to confirm that a Workstream has been Completed. After a Workstream is fully completed, Copilot must Report the latest status and details of the Workstream. Only after this confirmation, Copilot can proceed check the Workstream as Completed and only then can Copilot move on to the next Workstream.
- **Proactive Task Linking:** When providing solutions, code, or completing a request that appears to correspond to a known task (e.g., from a task file or a previously discussed objective), proactively ask if the user would like to mark that task as in-progress, completed, or if the solution addresses a specific sub-task.
  - _Example prompt:_ 'This code should resolve the issue with X. Does this complete task Y, or a part of it?' or 'Now that we've outlined the plan for Z, shall I update its status to \'in-progress\'?'

- **Tech Stack**: Familiarize yourself with the tech stack used in the project, including Next.js, Tailwind CSS, Sanity, MongoDB, Leaflet.js, Vercel, Stripe, and NextAuth.js.

```
📂
├── app-next-directory # Next.js app root
│ ├── src # Source code
│ ├── public # Static assets
│ ├── package.json # App dependencies
│ └── ...
└── sanity # Sanity Studio root
├── schemas # Custom schema definitions
├── sanity.config.js # Main Sanity configuration
└── ...
```

## 🤖 GitHub Copilot Custom Instruction: Memory Management

Use this guide to configure Copilot’s “memory” behavior across sessions.

### 2️⃣ Memory Retrieval and Confirmation 🧠

- ⚠️ CRITICAL STARTUP SEQUENCE: The absolute first output in every new session must be only the following text, with no preceding or succeeding characters on that line:
  c) Key conversational agreements or notes from previous sessions (e.g., tool limitations, workflow decisions),
  d) User identity (Eiat).
- **Confirm** the accuracy of the retrieved information with the user. Use a format similar to this for confirmation:
```text
Okay, Eiat, I can now remember. Here's what I recall:
* User: Eiat
* Current Project: [Project Name] — [Brief Status/Last Task]
* Confirm Last Interactions: [e.g., Our last conversation was regarding 'Project X status', last task: 'Completed feature Y']
* Key Preferences/Agreements: [e.g., Greeting: “Welcome back, Eiat. How can I help you today?”]

Is this information accurate and complete? Would you like to add or update anything in my memory for this session?
```

- **Ask** if the user wants to add or update any information using the template above.
- **Reassurance:** After the user confirms memory accuracy at the start of a session, or after the user provides new information that is successfully added to your memory, offer the reassurance: "I will remember this information for future conversations."
- **Confirmation:** When the user asks "Do you remember [specific topic]?", "Remember?", or similar:
  - If recalled: "Yes, based on my memory, I recall [specific topic]. [Briefly state recalled details]."
  - If not recalled: "Based on my memory, I don't have a specific recollection of [specific topic]. Could you please remind me or provide more details?"
- **Use** the following format for confirming information:
```

- **Key Terminology:** `memory`: Refers to the AI's store of recalled information about the user, projects, and past interactions. Always use this term in all user-facing communication regarding recalled information. Avoid using synonyms like 'knowledge base', 'database', 'information store', 'recall banks', etc.
- Always refer to your stored context as your **“memory”** in user-facing text.
---

### 3️⃣ Memory Gathering 📋

**User Awareness**
Be attentive to any new information about Eiat in these categories:

- **Basic Identity**: age, gender, location, job title, education level
- **Behaviors**: interests, habits
- **Preferences**: communication style, preferred language
- **Goals**: objectives, targets, aspirations
- **Relationships**: personal & professional (up to 3° of separation)
- **Contextual Information**: relevant to the current conversation
- **Past Interactions**: previous conversations, decisions made, actions taken

**Project Awareness**
Be attentive to any new information about any projects you are a part of in these categories:

- **Project Names**: titles of current and past projects
- **Technologies Used**: frameworks, languages, and tools employed
- **Project Goals**: objectives and desired outcomes
- **Team Members**: individuals involved in each project
- **Project Status**: current progress and any blockers
---

### 4️⃣ Memory Update 🔄

**User Contextual**
When new information about Eiat is provided or new facts appear during conversation:

1. **Create** entities for recurring organizations, people, or events
2. **Link** them to existing nodes with appropriate relations
3. **Store** each fact as an observation in your memory graph

**Example:**

- If a user mentions a new project, create a node for it and link it to the user
- Store the project details as an observation

**Project's Contextual**
When new information about projects is provided:
1. **Create** entities for new projects, technologies, or team members
2. **Link** them to existing nodes with appropriate relations
3. **Store** each fact as an observation in your memory graph

**Example:**

- Store the project details as an observation
- If a user mentions a new technology, create a node for it and link it to the relevant project
- Store the technology details as an observation
- If a user mentions a new team member, create a node for them and link it to the relevant project
- Store the team member details as an observation
---

### 5️⃣ Memory Maintenance 🗃

- Regularly review and clean up memory graph to remove outdated or irrelevant information
- Implement versioning for key entities to track changes over time
- Use timestamps to manage the lifecycle of observations
- Provide users with the ability to update or delete their information
- Ensure compliance with data privacy regulations
---

## 🛠️ Tooling Guidelines & Known Constraints

**Tooling Notes & Constraints:**
    - List tools with known issues or deprecations and preferred alternatives. If none, add: “None currently.”alternatives
    - *Example:* 'The "XYZ" tool is currently best avoided for tasks related to ABC due to 'reason'. Please confirm with Eiat before using it for such purposes.'
    - Specify preferred tools for common operations if there are multiple options and a clear preference exists.

---

## ⚠️ Error Handling & Escalation Protocol

- **Tool/Command Errors:**
    1.  If a tool call or terminal command fails, first analyze the error output.
    2.  If a simple, obvious fix is apparent (e.g., a clear typo I made in a command, a missing but easily creatable prerequisite that doesn\'t require complex logic), attempt to self-correct *once*.
    3.  If the self-correction fails, or if the error is not immediately understandable or fixable, present the full command/tool input, the complete error message, and any insights you have to Eiat. Do not make repeated unprompted attempts.
- **Code Generation Errors (Linting/Compilation):**
    1.  After generating code, if `get_errors` (or similar feedback) indicates issues, attempt to fix them.
    2.  If errors persist after 2-3 focused attempts on the same set of issues, present the code with the remaining errors highlighted and ask Eiat for guidance or clarification.
---

## 💻 Code Quality & Standards:

-  **Code Standard:** All generated or modified code must adhere to the project's established linting rules (e.g., from eslint.config.mjs) and general best practices for the language/framework in use. Prioritize clear, self-documenting code where possible to enhance readability.
-  **Commenting & Documentation:** For complex functions, non-obvious logic, or significant code blocks, proactively offer to add explanatory comments or JSDoc-style documentation. For example: 'This function handles X. Would you like me to add detailed comments or JSDoc for it?'.
-  **Temporary & Debugging Artifacts:** To align with team practices for managing temporary testing and debugging artifacts:
    
    1. When generating temporary files for testing (e.g., a simplified page to debug an issue), prefix the filename with FORTEST- or DEBUG-. Example: FORTEST-user-profile.html or DEBUG-api-service.ts.
    2. For temporary code within existing files, add: // FORTEST: <brief reason> or // FIXME: <brief reason>. Remove before merging.

    - *ATTENTION* If there are parts of the code that require future attention or are incomplete based on the immediate request, mark them clearly with // TODO: 'Reason' comments.

---

## ❓ Query Clarification Protocol

- If a user request is ambiguous, lacks necessary detail for confident execution, or could be interpreted in multiple ways that significantly alter the outcome:
    1.  Do not proceed based on a best guess if the ambiguity is high.
    2.  Clearly state what aspects are unclear.
    3.  Ask specific clarifying questions to resolve the ambiguity before attempting to fulfill the request.
        - *Example:* 'To make sure I understand correctly, when you say "update the component," do you mean X or Y? Could you please specify?'
---

## 📁 File System Interaction Guidelines

- **Batch Operations:** If a request involves creating or modifying multiple files (e.g., scaffolding several new components), first outline the proposed file changes (names, locations, brief purpose) and ask for Eiat's confirmation before proceeding with the actual file operations.
- **Overwriting/Deletion:** Exercise extreme caution. If an operation might overwrite or delete existing files (unless explicitly part of a "replace" or "delete" command from Eiat), seek explicit confirmation, stating which files are at risk.
---

## Copilot Instructions for Sustainable Digital Nomads Directory
### Overview
This document provides detailed instructions for GitHub Copilot to assist in the development of the Sustainable Digital Nomads Directory project. It includes guidelines for memory management, task management, and directory navigation using PowerShell 7.

### Directory Navigation
When navigating the project directory, use PowerShell 7 and follow the best practices in “5. Directory Navigation (Desktop Commander Requirements)”.
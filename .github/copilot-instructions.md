---
applyTo: "**"
---

### 📦 **Github Copilot Rules of Conduct**🚀

## Instructions File Permissions

# **This file is read-only for Copilot. It cannot be modified or deleted by Copilot. Any changes to this file must be made manually by Eiat and Eiat only.**

## 📑 **Rules Set**

- **Memory Management**: Use the provided memory management guidelines to retrieve, confirm, and update information about the user and projects.
- **Task Management**: Follow the Workstream Documentation {".\\memory-bank\\parallel_workstreams\\*"} to track latest Project's status, Before a Task is to be CONSIDERDED as Completed, Copilot must reassure that the task is actually completed. If the Tasks is UX/UI related. An #MCP Tool #Playwrite or #BrowserTool must be use for confirmation. Only then Copilot must Update Task Status to Complete.
- **Task Policies**: Immediately after a status change, whether from 'Not Started' to 'In Progress' or 'In Progress' to 'Completed'. You must ensure Tasks Statuses are Updated accordingly in Real-Time. Do not report to the User after every status change. Only report back mid Workstream when 1. Copilot is struck and cannot progress. 2. Only if the User explicitely asks for a status update. 3. When the whole Workstream is Completed.
- **Workstream Completeness Confirmation**: In order to confirm that a Workstream has been Completed. After a Workstream is fully completed, Copilot must Report the latest status and details of the Workstream. Only after this confirmation, Copilot can proceed check the Workstream as Completed and only then can Copilot move on to the next Workstream.
- **Proactive Task Linking:** When providing solutions, code, or completing a request that appears to correspond to a known task (e.g., from a task file or a previously discussed objective), proactively ask if the user would like to mark that task as in-progress, completed, or if the solution addresses a specific sub-task.
  - _Example prompt:_ 'This code should resolve the issue with X. Does this complete task Y, or a part of it?' or 'Now that we've outlined the plan for Z, shall I update its status to \'in-progress\'?'

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

## 📑 **Directory Navigation with File System MCP server in Powerhell 7 **
- **Change Directory Best Practices:** - **Change Directory**: Use PowerShell's `Set-Location` cmdlet to change directories in the terminal.
    For example, `Set-Location -Path "src\components"` to navigate to the components directory.
- **IMPORTANT:** Use #file system mcp server to help navigate the codebase.
    You must use absolute full paths with the drive letter in CAPITAL LETTER as shown in the following example: ('Set-Location -Path "D:\Eiat_Folder\MyProjects\MyOtherProjects\sustainable-eco-friendly-digital-nomads-directory').
    This is crucial in ensuring tools usage reliability.
- **Forbidden** Relative paths and lowercase as drive letter will fail as they are depend on the current working directory. Tilde paths (~/...) might not work in all contexts.

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
    ```

## 🤖 GitHub Copilot Custom Instruction: Memory Management

Use this guide to configure Copilot’s “memory” behavior across sessions.

---

# 1️⃣ User Identification 👤

- **Assume** you are interacting with **Eiat**
- If **Eiat** is not yet known, **proactively** determine their identity

---

# 2️⃣ Memory Retrieval and Confirmation 🧠

- **⚠️ CRITICAL STARTUP SEQUENCE:** The _absolute first output_ in every new session _must_ be _only_ the following text, with no preceding or succeeding characters on that line:

Retrieving Memory...
```

- Do not include any greetings, conversational fillers, or other text before or after `Remembering...` in the initial output. This step is purely for signaling memory retrieval.

- **Retrieve** all relevant information from your memory. 'Relevant information' includes, but is not limited to:
  a) Core project details (name, status, tech stack),
  b) User-stated preferences (e.g., preferred greetings, communication style),
  c) Key conversational agreements or notes from previous sessions (e.g., tool limitations, workflow decisions),
  d) User identity (Eiat).
- **Confirm** the accuracy of the retrieved information with the user. Use a format similar to this for confirmation:
```
  
  Okay, Eiat, I can now remember. Here's what I recall:
  *   **User:** Eiat
  *   **Current Project:** [Project Name] - [Brief Status/Last Task]
  *   **Confirm Last Interactions:** [e.g., Our Last conversation was regarding.......: 'Project X status', Last task: 'Completed feature Y']
  *   **Key Preferences/Agreements:** [e.g., Greeting: Welcome back Eiat, how can I help you today.]
        
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
- Always refer to your knowledge graph as your **“memory”**
---

# 3️⃣ Memory Gathering 📋

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

# 4️⃣ Memory Update 🔄

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

# 5️⃣ Memory Maintenance 🗃

- Regularly review and clean up memory graph to remove outdated or irrelevant information
- Implement versioning for key entities to track changes over time
- Use timestamps to manage the lifecycle of observations
- Provide users with the ability to update or delete their information
- Ensure compliance with data privacy regulations
---

 🛠️ **Tech Stack**

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
---

🌐 **Backend / API Route Conventions**

- **Endpoint Structure:** REST-like endpoints under `/src/app/api/*`
  (📌 _SustainableDigitalNomadsDirectory also uses `app-next-directory/src/app` for Next.js API Routes_)
- **Strict Adherence Required:** When generating or modifying API routes, always ensure the solution strictly adheres to the specified endpoint structure, naming conventions, and JSON response format outlined here. If a deviation is considered, it must be explicitly discussed and approved by Eiat.
---

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

# ⚡ **Development Workflow**

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
     - **Proactive Assistance:** In line with your role of assisting with code scaffolding, reviews, and documentation, proactively offer help when appropriate.
       - _Examples:_
         - After generating a complex function: 'Would you like me to add JSDoc comments or a brief explanation for this?'
         - When discussing a new component: 'I can help scaffold the basic file structure and boilerplate for this new component if you\'d like.'
         - Before committing changes (if context allows): 'If you provide the files, I can help look for common issues or areas for review.'
   - Next.js 14+ with App Router for full-stack rendering and API routes.
   - Tailwind CSS for styling.
   - Sanity as a headless CMS for content management.
   - MongoDB Atlas for user and auth data.
   - Leaflet.js + OpenStreetMap for map integration.
   - Vercel Hobby tier for deployment.
   - Regular code reviews and documentation updates maintained with Copilot.
---

# 🔒 **Security & Environment Management**

- **Secrets Management:** Store all secrets (DB URI, Stripe key) securely in Vercel or Cloudflare environment configuration.
  (📌 _SustainableDigitalNomadsDirectory config stores API keys securely in environment variables on Vercel or Railway_)

- **Secure Headers:** Enforce HTTPS and secure headers using middleware in Next.js.

- **Rate Limiting:** Implement rate-limiting on critical endpoints using middleware or Cloudflare Turnstile.

- **Backups:** Nightly backups of CMS & database via provider-level snapshots (within free-tier limits).

- **Environment Configuration:** Use Vercel or Cloudflare environment configuration for secrets.
  (📌 _SustainableDigitalNomadsDirectory uses Vercel or Railway_)
---

# 🔒 **Dependencies & Security**

- **Next.js Version:** 14.2.28 (Security patched version)
- **Authentication:**
  - NextAuth.js (^4.24.5)
  - @auth/mongodb-adapter (2.0.0 - Stable version)
- **Database:** MongoDB (^6.3.0)
- **CMS Integration:**
  - @sanity/client (^6.12.3)
  - @sanity/image-url (^1.0.2)

# 🗝️ **Security Best Practices**

- Always use exact versions for security-critical packages
- Regular security audits with `npm audit`
- Keep Next.js updated to latest security-patched version
- Use stable versions of authentication adapters
- Implement proper CORS and CSP headers
- Regular dependency updates for security patches
---

##  🛠️ **Tooling Guidelines & Known Constraints**

- **Tooling Notes & Constraints:**
    - List any tools that have known issues, are deprecated, or should be used with specific caution.
    - *Example:* 'The "XYZ" tool is currently best avoided for tasks related to ABC due to [reason]. Please confirm with Eiat before using it for such purposes.'
    - Specify preferred tools for common operations if there are multiple options and a clear preference exists.
---

# ⚠️ Error Handling & Escalation Protocol

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
    1. When generating temporary files specifically for testing purposes (e.g., a simplified page to debug an issue), prefix the filename with FORTEST- or DEBUG-. For example: FORTEST-user-profile.html or DEBUG-api-service.ts [conversation history].
    2. For temporary variables, code snippets, or queries inserted for testing or debugging within existing files, add a clear comment at the relevant location: // FORTEST: [Brief reason for testing/debugging] or // FIXME: [Brief reason for temporary modification] [conversation history].
        - *ATTENTION* If there are parts of the code that require future attention or are incomplete based on the immediate request, mark them clearly with // TODO: [Reason] comments.
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
# Overview
This document provides detailed instructions for GitHub Copilot to assist in the development of the Sustainable Digital Nomads Directory project. It includes guidelines for memory management, task management, and directory navigation using PowerShell 7.
# Task Management
For this project, please adhere to the task management guidelines outlined in the "📑 **Rules Set**" section at the beginning of this document. This includes proactive task linking and updating task statuses as appropriate.
# Directory Navigation
When navigating the project directory, please use PowerShell 7 and follow the best practices and examples provided in the "📑 **Directory Navigation with PowerShell 7**" section of this document.
````

# Upgrade: Tailwind CSS v4 + shadcn UI

This document records the steps taken (and recommended) to upgrade the project to Tailwind CSS v4 and ensure compatibility with Shadcn UI (Radix-based components).

Summary of actions
- Run the Tailwind v4 codemod to migrate utilities and CSS-first syntax.
- Update `app-next-directory/app/globals.css` to use CSS-first imports instead of `@tailwind` directives.
- Ensure `tsconfig.json` contains `baseUrl` and `paths` with an `@/...` alias (already present in this repo).
- Add a small `tailwind.config.cjs` shim if tools expect a JS config while your main config is `tailwind.config.js` or `.ts`.
- Update `tailwind.config.js` to include App Router paths (`./app/**/*.{js,ts,jsx,tsx}` and `./src/**/*.{js,ts,jsx,tsx}`).
- Pin core package versions in `app-next-directory/package.json` (e.g., `tailwindcss ^4.0.0`) and add `@shadcn/ui` at the recommended version.
- Documented every step and workarounds in this file.

Prerequisites
- Node 20+ and pnpm installed (repo uses pnpm workspace)
- Make a feature branch and commit changes incrementally

1) Run codemod (recommended)

Tailwind Labs provides an official codemod to migrate to v4. Run this locally in a branch.



Notes:
- Review diffs carefully. The codemod can make broad changes.
- If you cannot run the codemod in CI, run it locally and commit the changes.

2) Convert global CSS to CSS-first imports

Tailwind v4 prefers CSS-first usage. Replace `@tailwind base; @tailwind components; @tailwind utilities;` with a top-level import and then import CSS layers as needed.

Example replacement in `app/app/globals.css`:

```css
/* Option A: Single-line canonical import (Tailwind v4 recommended)
   Source: Tailwind v4 docs/release notes */
@import "tailwindcss";

/* keep your custom layers below */
@layer base { /* ... */ }
@layer components { /* ... */ }
@layer utilities { /* ... */ }
```

```css
/* Option B: Explicit layered imports (alternative canonical form)
   Source: Tailwind v4 docs/release notes */
@import "tailwindcss/base";
@import "tailwindcss/components";
@import "tailwindcss/utilities";

/* keep your custom layers below */
@layer base { /* ... */ }
@layer components { /* ... */ }
@layer utilities { /* ... */ }
```

> Note: The previous example referenced `tailwindcss/css-imports`, which is not the canonical import path for v4; prefer one of the two forms above per Tailwind v4 guidance.

3) Ensure your Tailwind config includes App Router paths

`tailwind.config.js` should include at minimum:

```js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // ...rest of your config
}
```

4) Add shim `tailwind.config.cjs` if necessary

Some tools look for a JS config file. If you have a `tailwind.config.ts`, add a small `tailwind.config.cjs` that requires your TS file via ts-node or points to the compiled JS.

Example (`app-next-directory/tailwind.config.cjs`):

```js
// require the JS config if it exists
module.exports = require('./tailwind.config.js');
```

5) Pin package versions

In `app-next-directory/package.json`:
- Pin `tailwindcss` to `^4.0.0` (or concrete `4.x` release you choose)
- Add `@shadcn/ui` at recommended version (check latest docs), and verify Radix peer deps like `@radix-ui/react-*` are installed and compatible.

Example:

```json
"devDependencies": {
  "tailwindcss": "^4.0.0",
  // ...
},
"dependencies": {
  "@shadcn/ui": "^0.0.0-REPLACE",
}
```

6) Update tsconfig paths (alias)

Verify `app-next-directory/tsconfig.json` contains:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

7) Test and fix any runtime or build issues

- Run `pnpm install` and `pnpm build` or `pnpm dev` and verify the site runs.
- Fix any errors from missing peer deps (install missing `@radix-ui/react-*` packages).
- If components expect Tailwind classes that changed names, update the code (review codemod output).

8) Document any workarounds here (examples)

- If some classes are removed/renamed in v4, note the replacement.
- If `@shadcn/ui` requires a different setup, include example import lines.

9) Commit & open PR

- Create a feature branch, commit changes, run tests, open a PR with this UPGRADE.md linked.

---

If you want, I can:
- Apply the config and package.json changes here and create `docs/UPGRADE.md` (done).
- Prepare a separate PR that runs the codemod locally (I can't execute the codemod in CI here).
# Active Context: PrismJS Vulnerability in Sanity

**Date:** May 14, 2025

**Primary Goal:** Resolve PrismJS vulnerabilities within the `sanity/` project, primarily stemming from nested dependencies of `@sanity/ui`.

**Current State of Key Files:**

*   `sanity/package.json`:
    *   `"type": "module"`
    *   **Dependencies:**
        *   `"@sanity/ui": "^3.0.0-static.6"`
        *   `"prismjs": "1.30.0"` (exact)
        *   `"refractor": "4.8.1"` (exact)
        *   `"react-refractor": "3.1.1"` (exact)
    *   **Overrides:** Extensive overrides for `prismjs`, `refractor`, `react-refractor` globally (`**/...`) and specifically for `@sanity/ui` and `sanity-plugin-media`.
        ```json
        "overrides": {
          "prismjs": "^1.30.0",
          "refractor": "^4.8.1",
          "react-refractor": "^3.1.1",
          "**/prismjs": "^1.30.0",
          "**/refractor": "^4.8.1",
          "**/react-refractor": "^3.1.1",
          "@sanity/ui": {
            "prismjs": "^1.30.0",
            "refractor": "^4.8.1",
            "react-refractor": "^3.1.1"
          },
          "sanity-plugin-media": {
            "prismjs": "^1.30.0",
            "refractor": "^4.8.1",
            "react-refractor": "^3.1.1"
          }
        }
        ```
    *   **Scripts:**
        *   `"postinstall": "node scripts/patch-prismjs.js"`

*   `sanity/.npmrc`:
    ```
    legacy-peer-deps=true
    resolution-mode=highest
    strict-peer-dependencies=false
    public-hoist-pattern[]=*prismjs*
    public-hoist-pattern[]=*refractor*
    public-hoist-pattern[]=*react-refractor*
    ```

*   `sanity/scripts/patch-prismjs.js`:
    *   ES Module script designed to find `package.json` files in `node_modules`, check for `prismjs` dependencies with versions < 1.29.0, update them to `^1.30.0`, and run `npm install` in that specific package directory.
    *   **Current Issue:** The script reported patching 0 dependencies in its last run, indicating it's not effectively resolving the vulnerabilities.

**Persistent Problem:**

*   `npm audit` (after `rm -rf node_modules && npm install`) still reports 4 moderate severity PrismJS vulnerabilities. The primary path is often: `@sanity/ui` -> `react-refractor` -> `refractor` -> `prismjs@<vulnerable_version>`.
*   The combination of direct dependency updates, npm overrides, `.npmrc` settings, and the postinstall patch script has not yet fully resolved the issue.

**Next Focus:**

*   Debugging the `patch-prismjs.js` script.
*   Further deep dive into the dependency tree to understand why overrides are not fully effective for `@sanity/ui`'s transitive dependencies.
*   Exploring alternative patching methods or seeking Sanity-specific solutions.

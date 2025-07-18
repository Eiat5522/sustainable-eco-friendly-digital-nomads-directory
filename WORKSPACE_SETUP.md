# NPM Workspace Setup

# -----------------

The pnpm workspace configuration has been moved to the root directory to fix the warning:
"npm warn config ignoring workspace config"

## Project Structure

This project is set up as an npm workspace with the following structure:

- Root: Contains shared configuration and workspace settings
- app-next-directory: Next.js application
- sanity: Sanity Studio instance

## Running Scripts from the Root

You can run any script for either workspace directly from the root:

```bash
# Run Next.js development server
npm run dev:next

# Run Sanity development server
npm run dev:sanity

# Build both workspaces
npm run build

# Run linting on Next.js app
npm run lint
```

## Configuration

The shared npm configuration is now in the root `.npmrc` file with:

- legacy-peer-deps=true
- strict-peer-dependencies=false
- auto-install-peers=true
- resolution-mode=highest
- workspaces=true

This ensures npm properly recognizes the workspace structure and applies the configuration consistently.

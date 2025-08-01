# PNPM Workspace Setup

The npm workspace configuration has been dropped in favour of pnpm workspace configuration and has been moved to the root directory to fix the warning:
"npm warn config ignoring workspace config"

## Project Structure

This project is set up as an pnpm workspace with the following structure:

- Root: Contains shared configuration and workspace settings
- app-next-directory: Next.js application
- sanity: Sanity Studio instance

## Running Scripts from the Root

You can run scripts for each workspace directly from the root using `pnpm`:

```bash
# Run Next.js development server
pnpm --filter ./app-next-directory dev

# Run Sanity development server
pnpm --filter ./sanity dev

# Build both workspaces
pnpm run build

# Run linting
pnpm run lint

# Generate TypeScript types for Sanity schemas
pnpm run codegen:sanity

# Run type-checking for Next.js app
pnpm tsc --noEmit

# Execute Unit Tests (Jest)
pnpm exec jest

# Install Playwright CLI
npx playwright install

# Execute All Tests (Playwright)
pnpm test

```

## Configuration

The project uses a `.npmrc` file in the root directory for shared npm configuration:

```txt
legacy-peer-deps=true
strict-peer-dependencies=false
auto-install-peers=true
resolution-mode=highest
workspaces=true
```

This ensures npm properly recognizes the workspace structure and applies the configuration consistently.

**Environment Variables:** Store secrets and sensitive information in Vercel or Cloudflare environment variables. This practice ensures security and proper management of sensitive data.

## Sanity Codegen and DTO Integration

- **Sanity Codegen**: Automatically generates TypeScript types for Sanity schemas. Run `npm run codegen:sanity` to update types after modifying schemas.
- **DTO Adoption**: The Next.js app uses Data Transfer Objects (DTOs) for consistent data handling. DTOs are defined in `app-next-directory/src/types/appView.ts` and align with the generated Sanity types.

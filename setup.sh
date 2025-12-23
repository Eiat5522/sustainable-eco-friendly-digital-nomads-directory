#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Starting project setup..."

# Step 1: Install pnpm dependencies for the entire monorepo
echo "Installing pnpm dependencies for all workspaces..."
pnpm install

# Step 2: Run postinstall tasks explicitly (Playwright + MSW)
echo "Running postinstall scripts (Playwright + MSW)..."
pnpm --filter app-next-directory run postinstall

# Step 3: Ensure Playwright browsers + OS deps are installed for E2E tests
if [[ "${SKIP_PLAYWRIGHT_INSTALL:-}" != "1" && "${PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD:-}" != "1" ]]; then
  echo "Installing Playwright browsers (with system deps)..."
  if [[ "${CI:-}" == "true" || "${CI:-}" == "1" ]]; then
    pnpm --filter app-next-directory exec playwright install chromium --with-deps || {
      echo "WARNING: Playwright install failed. Run:"
      echo "   pnpm --filter app-next-directory exec playwright install --with-deps"
    }
  else
    pnpm --filter app-next-directory exec playwright install --with-deps || {
      echo "WARNING: Playwright install failed. Run:"
      echo "   pnpm --filter app-next-directory exec playwright install --with-deps"
    }
  fi
else
  echo "Skipping Playwright install (SKIP_PLAYWRIGHT_INSTALL=1 or PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1)"
fi

# Step 4: Prime mongodb-memory-server binary cache for integration tests
export MONGOMS_DOWNLOAD_IGNORE_MISSING_HEADER="${MONGOMS_DOWNLOAD_IGNORE_MISSING_HEADER:-1}"

echo "Priming mongodb-memory-server binary cache..."
pushd "$ROOT_DIR/app-next-directory" >/dev/null
if ! node <<'NODE'
const { MongoMemoryServer } = require('mongodb-memory-server');

async function main() {
  const server = await MongoMemoryServer.create();
  console.log(`[mongodb-memory-server] Ready: ${server.getUri()}`);
  await server.stop();
}

main().catch(err => {
  console.error('[mongodb-memory-server] Failed to download/start:', err?.message || err);
  process.exit(1);
});
NODE
then
  echo "WARNING: mongodb-memory-server cache warm-up failed."
  echo "   You can retry with:"
  echo "   MONGOMS_DOWNLOAD_IGNORE_MISSING_HEADER=1 pnpm --filter app-next-directory test:integration"
fi
popd >/dev/null

# Step 5: Extract Sanity Schemas to schema.json
echo "Extracting Sanity's Schemas"
npx -y sanity@latest schema extract

# Step 6: Generate TypeScript types for Sanity schemas
echo "Generating TypeScript types for Sanity schemas..."
npx -y sanity@latest typegen generate

# Step 7: Docker checks for containerized E2E
echo "Checking Docker availability for containerized E2E..."
if command -v docker >/dev/null 2>&1; then
  if docker info >/dev/null 2>&1; then
    echo "Docker is available."
  else
    echo "WARNING: Docker CLI found but daemon is not running."
  fi

  if docker compose version >/dev/null 2>&1; then
    echo "Docker Compose is available."
  elif command -v docker-compose >/dev/null 2>&1; then
    echo "Docker Compose (legacy) is available."
  else
    echo "WARNING: Docker Compose is missing. Install it to run containerized E2E."
  fi
else
  echo "WARNING: Docker not found. Install Docker to run E2E in containers."
fi

echo "Project setup complete!"

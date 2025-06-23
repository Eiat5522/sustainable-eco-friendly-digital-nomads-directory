#!/bin/bash
# Setup script for Sustainable Digital Nomads Directory (Next.js, Sanity, pnpm monorepo)
# This script installs all dependencies and prepares the environment for development and testing.

# Install type checker
pip install pyright
# Install dependencies
pnpm install

# Install Playwright browsers (for E2E tests, if Playwright is used)
if [ -f "pnpm-lock.yaml" ]; then
  if grep -q "@playwright/test" pnpm-lock.yaml; then
    echo "Installing Playwright browsers..."
    pnpm exec playwright install
  fi
fi

# Type checking (optional, if using TypeScript)
echo "Running type check..."
pnpm run typecheck || true

# Linting (optional, if using ESLint)
echo "Running lint..."
pnpm run lint || true

# Build Next.js app (optional, for production)
# pnpm --filter ./app-next-directory build

# Build Sanity Studio (optional, for production)
# pnpm --filter ./sanity build

echo "Setup complete. Ready for development!"

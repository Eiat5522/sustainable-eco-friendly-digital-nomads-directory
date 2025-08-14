#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Starting project setup..."

# Step 1: Install pnpm dependencies for the entire monorepo
echo "Installing pnpm dependencies for all workspaces..."
pnpm install

# Step 2: Install Playwright browsers
echo "Installing Playwright browsers..."
pnpm playwright install --with-deps

# Step 3: Extract Sanity Schemas to schema.json
echo "Extracting Sanity's Schemas"
npx -y sanity@latest schema extract

# Step 4: Generate TypeScript types for Sanity schemas
echo "Generating TypeScript types for Sanity schemas..."
npx -y sanity@latest typegen generate

echo "Project setup complete!"
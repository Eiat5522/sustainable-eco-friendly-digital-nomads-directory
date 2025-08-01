#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Starting project setup..."

# Step 1: Install pnpm dependencies for the entire monorepo
echo "Installing pnpm dependencies for all workspaces..."
pnpm install

# Step 2: Install Playwright browsers
echo "Installing Playwright browsers..."
npx playwright install --with-deps

# Step 3: Generate TypeScript types for Sanity schemas
echo "Generating TypeScript types for Sanity schemas..."
pnpm run extract-schema

# Step 4: Remind about environment variables
echo "----------------------------------------------------"
echo "IMPORTANT: Environment Variables Setup"
echo "Please ensure you have set up your environment variables."
echo "For local development, create a .env.local file in the 'app-next-directory' and 'sanity' folders."
echo "Refer to the project documentation for required variables (e.g., .env.example if available)."
echo "----------------------------------------------------"

echo "Project setup complete!"
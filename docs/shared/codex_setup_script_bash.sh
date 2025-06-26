#!/bin/bash
# Setup script for Sustainable Digital Nomads Directory (Next.js, Sanity, pnpm monorepo)
# This script installs all dependencies and prepares the environment for development and testing.

# Install type checker
pip install pyright

# Python type checking (optional, if using Pyright)
echo "Running Python type check with pyright..."
pyright . || true

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

# Install all required root, app-next-directory, and sanity dependencies
# Root dependencies
pnpm add @sanity/client@^7.6.0 @sanity/code-input@^5.1.2 bcrypt@^6.0.0 clsx@^2.1.1 react-hook-form@^7.58.1 resend@^4.6.0 vscode-variables@^1.0.1
# Root devDependencies
pnpm add -D @auth/mongodb-adapter@^3.10.0 @playwright/test@^1.53.1 cross-fetch@^4.1.0 eslint@^9.29.0 eslint-config-next@^15.3.4 playwright@^1.53.1

# app-next-directory dependencies
pnpm --filter app-next-directory add @auth/mongodb-adapter@^3.10.0 @hookform/resolvers@^5.1.1 @portabletext/react@^3.2.1 @radix-ui/react-avatar@^1.1.10 @radix-ui/react-checkbox@^1.3.2 @radix-ui/react-collapsible@^1.1.11 @radix-ui/react-dropdown-menu@^2.1.15 @radix-ui/react-separator@^1.1.7 @radix-ui/react-slot@^1.2.3 @radix-ui/react-switch@^1.2.5 @radix-ui/react-tabs@^1.1.12 @remixicon/react@^4.6.0 @sanity/client@^7.6.0 @sanity/code-input@5.1.2 @sanity/image-url@^1.1.0 @sanity/vision@3.93.0 bcryptjs@^3.0.2 class-variance-authority@^0.7.1 clsx@^2.1.1 dotted-map@^2.2.3 embla-carousel-autoplay@^8.6.0 embla-carousel-react@^8.6.0 framer-motion@^12.18.1 leaflet@^1.9.4 leaflet.markercluster@^1.5.3 lucide-react@^0.522.0 mongodb@^6.17.0 mongoose@^8.16.0 next@^15.3.4 next-auth@^4.24.11 next-sanity@^9.12.0 next-sanity-image@^6.2.0 next-themes@^0.4.6 node-fetch@^3.3.2 nodemailer@^7.0.3 react@^19.1.0 react-dom@^19.1.0 react-hook-form@^7.58.1 react-intersection-observer@^9.16.0 react-leaflet@^5.0.0 string-similarity@^4.0.4 tailwind-merge@^3.3.1 tailwindcss-animate@^1.0.7 zod@^3.25.67
# app-next-directory devDependencies
pnpm --filter app-next-directory add -D @jest/globals@^30.0.2 @testing-library/jest-dom@^6.6.3 @testing-library/react@^16.3.0 @testing-library/user-event@^14.6.1 @types/dotenv@^8.2.3 @types/jest@^30.0.0 @types/leaflet@^1.9.18 @types/node@^24.0.3 @types/react@^19.1.8 @types/react-dom@^19.1.6 @types/supertest@^6.0.3 autoprefixer@^10.4.21 babel-jest@^30.0.2 dotenv@^16.5.0 jest@^30.0.2 jest-environment-jsdom@^30.0.2 postcss@^8.5.6 tailwindcss@^4.1.10 ts-jest@^29.4.0 typescript@^5.8.3

# sanity dependencies
pnpm --filter sanity add @auth/mongodb-adapter@^3.10.0 @sanity/code-input@5.1.2 @sanity/vision@3.93.0 leaflet.markercluster@^1.5.3 node-fetch@^3.3.2 react@^19.1.0 react-dom@^19.1.0 styled-components@^6.1.19
# sanity devDependencies
pnpm --filter sanity add -D @sanity/cli@^3.93.0 @sanity/eslint-config-studio@^5.0.2 @testing-library/jest-dom@^6.6.3 @types/dotenv@^8.2.3 @types/leaflet@^1.9.18 @types/react@^19.1.8 @types/supertest@^6.0.3 dotenv@^16.5.0 eslint@^9.29.0 prettier@^3.6.0 sanity@^3.93.0 typescript@^5.8.3

echo "Setup complete. Ready for development!"

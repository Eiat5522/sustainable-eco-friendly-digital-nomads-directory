Here is your complete guide converted into clean, well-structured Markdown format with proper headings, code blocks, lists, and formatting:

````markdown
# A Step-by-Step Guide to Setting Up a Unit Testing Environment in Next.js with Jest and TypeScript

## Introduction: Building a Resilient Next.js Application

The architectural paradigm shift introduced with the **Next.js App Router** and **Server Components** demands a more strategic approach to testing. For any team building robust, maintainable Next.js applications, a comprehensive unit testing strategy is a non-negotiable part of the development lifecycle.

Unit tests validate individual components and functions in isolation, catching regressions early, simplifying refactoring, and providing living documentation for your codebase.

This guide provides a **definitive walkthrough** for setting up a unit testing environment using the officially recommended toolset:

- **Jest** – Powerful JavaScript testing framework
- **React Testing Library (RTL)** – User-centric component testing

> Note: Jest + JSDOM cannot fully emulate Server Component runtime or complex async rendering boundaries. This setup focuses on **Client Components**, utility functions, and **deterministic Server Component output** with mocked inputs.

This tutorial covers **environment setup only** — not writing tests — so you’ll have a production-grade foundation ready to go.

---

### 1. Step 1: Installing Core Dependencies

Install all required development dependencies:

```shell
npm install -D \
  jest \
  jest-environment-jsdom \
  @testing-library/react \
  @testing-library/dom \
  @testing-library/jest-dom \
  ts-node \
  @types/jest
```
````

#### Package Roles

| Package                     | Purpose                                                                 |
| --------------------------- | ----------------------------------------------------------------------- |
| `jest`                      | Test runner, assertions, mocking                                        |
| `jest-environment-jsdom`    | Simulated browser environment for React components                      |
| `@testing-library/react`    | Render and interact with React components like a user                   |
| `@testing-library/jest-dom` | Custom DOM matchers (`.toBeInTheDocument()`, `.toHaveTextContent()`, …) |
| `@testing-library/dom`      | Peer dependency for Testing Library                                     |
| `ts-node`                   | Allows Jest to load `jest.config.ts` directly                           |
| `@types/jest`               | TypeScript definitions for Jest                                         |

---

### 2. Step 2: Initializing the Jest Configuration with `next/jest`

Next.js provides an official package that dramatically simplifies Jest setup.

```typescript
// jest.config.ts
import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Path to your Next.js app to load next.config.js and .env files
  dir: './',
});

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'], // uncomment in next step
};

export default createJestConfig(config);
```

**Pro Tip**: If your `package.json` has `"type: "module"`, rename the file to `jest.config.cjs` (CommonJS) because `next/jest` uses `require()` internally.

---

### 3. Step 3: Creating the Global Setup File

Create `jest.setup.ts` in your project root and tell Jest to use it.

```typescript
// jest.config.ts (update)
const config: Config = {
  // ...other options
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};
```

```typescript
// jest.setup.ts
import '@testing-library/jest-dom';
```

This makes all `@testing-library/jest-dom` matchers globally available.

---

### 4. Step 4: Configuring Module Path Aliases

Example `tsconfig.json` paths:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {',
}
```

#### Option B – Automatic & always in sync (recommended)

```bash
npm install -D ts-jest
```

```typescript
// jest.config.ts
import { pathsToModuleNameMapper } from 'ts-jest';
import { compilerOptions } from './tsconfig.json';

const config: Config = {
  // ...other config
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/',
  }),
};
```

---

### 5. Step 5: Adding Test Scripts to `package.json`

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

- `npm test` → one-time run (great for CI)
- `npm run test:watch` → interactive watch mode

---

### 6. Step 6: Advanced Setup (Optional but Recommended)

#### 6.1. Mocking `next/image`

```typescript
// jest.setup.ts (add to existing file)

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))
```

#### 6.2. Testing Server-Side Code (API routes, server actions, etc.)

Use Node environment per-file:

```ts
/**
 * @jest-environment node
 */

import { GET } from '@/app/api/hello/route';

test('returns hello world', async () => {
  const res = await GET();
  // ...
});
```

---

### 7. Step 7: Helper for Async Props in Next.js 16+ (Server Components)

Next.js 16+ passes `params` and `searchParams` as **Promises**. Your tests must reflect that.

```typescript
// src/lib/test-utils.ts (or any utils folder)

export const asyncProps = <T>(value: T): Promise<T> => Promise.resolve(value);

// Usage in a test
import { asyncProps } from '@/lib/test-utils';
import Page from './page';

test('renders page with async params', async () => {
  const page = await Page({
    params: asyncProps({ slug: 'test' }),
    searchParams: asyncProps({ q: 'hello' }),
  });
  render(page);
  // assertions...
});
```

Alternative short name: `generateAsyncValue`, `p`, or `mockAsyncProps` — whatever fits your team.

---

## Conclusion: Ready to Test!

You now have a **production-grade, scalable unit testing environment** for Next.js (App Router + TypeScript) that includes:

- Fast SWC-powered transforms via `next/jest`
- Automatic asset mocking & env loading
- Global jest-dom matchers
- Path alias support (auto-synced)
- Proper mocking of `next/image`
- Support for both `jsdom` and `node` environments
- Helper for Next.js 16+ async Server Component props

You're fully equipped to write confident, maintainable unit tests for Client Components, utilities, and Server Components.

**Happy testing!**

```

```

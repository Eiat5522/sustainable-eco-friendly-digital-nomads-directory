# Test Architecture - App Next Directory

**Last Updated:** November 1, 2025  
**Status:** ✅ Production Ready

## Overview

This document describes the current test architecture for the `app-next-directory` workspace, including completed testing phases, current test status, and architectural decisions.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Testing Phases](#testing-phases)
- [Test Configuration](#test-configuration)
- [Test Types and Locations](#test-types-and-locations)
- [Test Utilities](#test-utilities)
- [Mocking Strategy](#mocking-strategy)
- [CI/CD Integration](#cicd-integration)

---

## Architecture Overview

### Testing Stack

```
┌─────────────────────────────────────────────┐
│         Application Under Test              │
│      (Next.js 15 + App Router)             │
└─────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼────────┐    ┌────────▼────────┐
│  Jest Testing  │    │ Playwright E2E   │
│   Framework    │    │    Framework     │
└───────┬────────┘    └────────┬────────┘
        │                       │
   ┌────┴────┐            ┌────┴────┐
   │         │            │         │
┌──▼──┐  ┌──▼──┐     ┌──▼──┐  ┌──▼──┐
│Unit │  │Integ│     │ E2E │  │A11y │
│Tests│  │Tests│     │Tests│  │Tests│
└─────┘  └─────┘     └─────┘  └─────┘
```

### Tech Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Unit Testing** | Jest | 29.7.0 | Fast isolated tests |
| **Test Runner** | @jest/core | 29.7.0 | Test execution |
| **Component Testing** | React Testing Library | 16.1.0 | Component behavior tests |
| **E2E Testing** | Playwright | 1.55.0 | Browser automation |
| **Integration Testing** | mongodb-memory-server | 10.1.2 | In-memory database |
| **API Mocking** | MSW (Mock Service Worker) | 2.7.0 | API request mocking |
| **Test Utilities** | @testing-library/jest-dom | 6.6.3 | Custom matchers |

---

## Testing Phases

### Phase 1: Unit Testing (Completed ✅)

**Timeline:** Months 1-2  
**Status:** ✅ Completed

**Scope:**
- Component unit tests with React Testing Library
- Utility function tests
- Schema validation tests
- Custom hook tests

**Achievements:**
- ✅ 80%+ code coverage for utilities
- ✅ All critical components tested
- ✅ Schema validation comprehensive
- ✅ Mock setup infrastructure established

**Key Files:**
- `src/components/**/__tests__/*.test.tsx` - Component tests
- `src/lib/__tests__/*.test.ts` - Utility tests
- `src/models/__tests__/*.test.ts` - Schema tests

### Phase 2: Integration Testing (Completed ✅)

**Timeline:** Month 3  
**Status:** ✅ Completed

**Scope:**
- Database model integration tests
- API route integration tests
- External service integration
- Authentication flow integration

**Achievements:**
- ✅ mongodb-memory-server setup
- ✅ All models tested with real database
- ✅ API routes tested end-to-end
- ✅ MongoDB operations validated

**Key Files:**
- `src/models/__tests__/*.integration.test.ts` - Model integration tests
- `src/app/api/**/__tests__/*.integration.test.ts` - API route tests

### Phase 3: E2E Testing - Authentication (Completed ✅)

**Timeline:** Month 4  
**Status:** ✅ Completed

**Scope:**
- User authentication flows
- Role-based access control (RBAC)
- Session management
- Security testing

**Achievements:**
- ✅ 25+ authentication test cases
- ✅ RBAC comprehensive testing
- ✅ Cross-browser testing
- ✅ Mobile responsive testing

**Key Files:**
- `tests/e2e/auth.spec.ts` - Authentication tests
- `tests/e2e/rbac.spec.ts` - Role-based access control
- `tests/e2e/security/security.spec.ts` - Security tests

### Phase 4: E2E Testing - Application Features (Completed ✅)

**Timeline:** Month 5-6  
**Status:** ✅ Completed

**Scope:**
- Search and filtering
- Listing management
- Map integration
- User dashboard
- Reviews and favorites
- Responsive navigation
- Accessibility testing

**Achievements:**
- ✅ 120+ E2E test cases
- ✅ All critical user paths covered
- ✅ Cross-browser testing (Chrome, Firefox, Safari)
- ✅ Mobile device emulation
- ✅ Accessibility compliance testing

**Key Files:**
- `tests/e2e/search/` - Search functionality
- `tests/e2e/listing-management.spec.ts` - Listing CRUD
- `tests/e2e/city/city-and-map.spec.ts` - Map integration
- `tests/e2e/a11y/core-pages.spec.ts` - Accessibility
- `tests/e2e/responsive-navigation-layout.spec.ts` - Responsive design

---

## Test Configuration

### Jest Configuration Files

#### Unit Tests: `jest.config.cjs`

```javascript
module.exports = {
  displayName: 'unit',
  testEnvironment: 'jsdom',
  
  // Only run unit tests (exclude integration tests)
  testMatch: [
    '**/__tests__/**/*.test.{ts,tsx}',
    '**/*.test.{ts,tsx}'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '\\.integration\\.test\\.',
    '\\.int\\.test\\.'
  ],
  
  // Setup and transforms
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': ['@swc/jest', {
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: true
        },
        transform: {
          react: {
            runtime: 'automatic'
          }
        }
      }
    }]
  },
  
  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js'
  },
  
  // Coverage
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/app/**/layout.tsx',
    '!src/app/**/page.tsx'
  ]
};
```

**Key Features:**
- Excludes integration tests
- Uses SWC for fast compilation
- Configured for Next.js App Router
- Module path aliases support
- CSS module mocking

#### Integration Tests: `jest.integration.config.cjs`

```javascript
module.exports = {
  displayName: 'integration',
  testEnvironment: 'node',
  
  // Only run integration tests
  testMatch: [
    '**/__tests__/**/*.integration.test.{ts,tsx}',
    '**/__tests__/**/*.int.test.{ts,tsx}',
    '**/*.integration.test.{ts,tsx}',
    '**/*.int.test.{ts,tsx}'
  ],
  
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  
  // Serial execution to avoid database conflicts
  maxWorkers: 1,
  
  // Extended timeout for database operations
  testTimeout: 30000,
  
  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
```

**Key Features:**
- Node environment for database testing
- Serial test execution
- Extended timeouts
- MongoDB memory server support

### Playwright Configuration: `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  
  // Timeouts
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
  
  // Execution
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  
  // Shared settings
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  
  // Browser projects
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] }
    }
  ],
  
  // Web server
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI
  }
});
```

**Key Features:**
- Multi-browser testing
- Mobile device emulation
- Automatic dev server startup
- CI/CD optimizations
- Rich reporting

---

## Test Types and Locations

### Unit Tests

**Location Pattern:**
```
src/
├── components/
│   └── SearchForm/
│       ├── SearchForm.tsx
│       └── __tests__/
│           └── SearchForm.test.tsx          # Co-located unit test
├── lib/
│   └── __tests__/
│       └── formatPrice.test.ts
└── hooks/
    └── __tests__/
        └── useSearchListings.test.ts
```

**Naming:** `*.test.ts` or `*.test.tsx`  
**Framework:** Jest + React Testing Library  
**Environment:** jsdom (browser-like)  
**Execution:** Parallel  
**Speed:** Fast (< 50ms per test)

### Integration Tests

**Location Pattern:**
```
src/
├── models/
│   └── __tests__/
│       └── Listing.integration.test.ts     # Database integration
└── app/
    └── api/
        └── listings/
            └── __tests__/
                └── route.integration.test.ts    # API integration
```

**Naming:** `*.integration.test.ts` or `*.int.test.ts`  
**Framework:** Jest + mongodb-memory-server  
**Environment:** Node.js  
**Execution:** Serial (to avoid database conflicts)  
**Speed:** Medium (1-5s per test)

### E2E Tests

**Location Pattern:**
```
tests/
└── e2e/
    ├── auth/
    │   ├── auth.spec.ts                    # Authentication flows
    │   └── rbac.spec.ts                    # Role-based access
    ├── search/
    │   └── search-ux.spec.ts               # Search functionality
    ├── listing-management.spec.ts          # CRUD operations
    ├── city/
    │   └── city-and-map.spec.ts           # Map integration
    ├── a11y/
    │   └── core-pages.spec.ts             # Accessibility
    └── security/
        └── security.spec.ts                # Security testing
```

**Naming:** `*.spec.ts`  
**Framework:** Playwright  
**Environment:** Real browser (Chromium/Firefox/WebKit)  
**Execution:** Parallel (with worker limits)  
**Speed:** Slow (5-30s per test)

---

## Test Utilities

### Shared Test Helpers

**Location:** `tests/helpers/`

```
tests/helpers/
├── test-data.ts          # Canonical test dataset
├── test-setup.ts         # Global test setup
├── mockManager.ts        # Mock management utilities
├── typedMocks.ts         # Type-safe mock helpers
├── api.ts                # API test helpers
├── login.ts              # Authentication helpers
└── env.ts                # Environment utilities
```

### E2E Test Utilities

**Location:** `tests/e2e/helpers/` and `tests/e2e/utils/`

```
tests/e2e/
├── helpers/
│   └── auth.ts           # E2E authentication helpers
└── utils/
    └── discovery-helpers.ts   # Page discovery utilities
```

### Common Test Utilities

**Location:** `tests/utils/`

```
tests/utils/
└── README.md            # Utility documentation
```

### Key Utility Functions

#### Authentication Helpers (`tests/helpers/login.ts`)

```typescript
export async function loginAsUser(page: Page, role: string) {
  const credentials = getTestCredentials(role);
  await page.goto('/auth/login');
  await page.fill('[name="email"]', credentials.email);
  await page.fill('[name="password"]', credentials.password);
  await page.click('[type="submit"]');
  await page.waitForURL('/dashboard');
}
```

#### Test Data Management (`tests/helpers/test-data.ts`)

```typescript
export const TEST_DATASET = {
  users: [...],
  listings: [...],
  cities: [...],
  reviews: [...]
};

export function getTestData() {
  return structuredClone(TEST_DATASET);
}
```

#### Mock Manager (`tests/helpers/mockManager.ts`)

```typescript
export class MockManager {
  setupMocks() { /* ... */ }
  resetMocks() { /* ... */ }
  getMockInstance(name: string) { /* ... */ }
}
```

---

## Mocking Strategy

### API Mocking (MSW)

**Setup Location:** `__mocks__/handlers.ts`

```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/listings', ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search');
    
    return HttpResponse.json({
      listings: mockListings.filter(l => 
        l.title.includes(search || '')
      ),
      totalCount: 10
    });
  })
];
```

**Server Setup:** `__mocks__/server.ts`

```typescript
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

**Jest Integration:** `jest.setup.ts`

```typescript
import { server } from './__mocks__/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Playwright API Mocking

**Pattern:** Route interception

```typescript
test('search with mocked API', async ({ page }) => {
  await page.route('**/api/listings*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        listings: mockListings,
        totalCount: mockListings.length
      })
    });
  });
  
  await page.goto('/listings');
  // Test with controlled data...
});
```

### Module Mocking (Jest)

**Pattern:** Mock external dependencies

```typescript
// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
    query: {},
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock custom hooks
jest.mock('@/hooks/useSearchListings', () => ({
  useSearchListings: jest.fn()
}));
```

---

## CI/CD Integration

### GitHub Actions Workflow

**File:** `.github/workflows/test.yml`

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: pnpm install
      - run: pnpm --filter app-next-directory test:unit
      
  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: pnpm install
      - run: pnpm --filter app-next-directory test:integration
      
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: pnpm install
      - run: npx playwright install --with-deps
      - run: pnpm --filter app-next-directory test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: app-next-directory/playwright-report/
```

### Test Execution Flow

```
1. PR Created/Updated
   ↓
2. CI/CD Triggered
   ↓
3. Parallel Test Execution
   ├── Unit Tests (fastest)
   ├── Integration Tests (medium)
   └── E2E Tests (slowest)
   ↓
4. Results Aggregation
   ↓
5. Coverage Report
   ↓
6. PR Status Update
```

---

## Test Metrics

### Current Status (as of Nov 2025)

**Unit Tests:**
- Total Tests: ~150
- Coverage: 82%
- Avg Execution: 35ms per test
- Total Duration: ~8 seconds

**Integration Tests:**
- Total Tests: ~45
- Coverage: All models and API routes
- Avg Execution: 2.5s per test
- Total Duration: ~2 minutes

**E2E Tests:**
- Total Tests: 120+
- Browser Coverage: Chrome, Firefox, Safari
- Mobile Coverage: iOS, Android
- Avg Execution: 15s per test
- Total Duration: ~10 minutes

### Performance Targets

- Unit Tests: < 1 minute total
- Integration Tests: < 5 minutes total
- E2E Tests: < 15 minutes total
- CI/CD Full Suite: < 20 minutes total

---

## Related Documentation

- [Testing README](./README.md) - Main testing documentation
- [Test Writing Guide](../../tests/WRITING_GUIDE.md) - How to write tests
- [API Mocking Guide](../../tests/API-MOCKING.md) - API mocking patterns
- [E2E README](../../tests/e2e/README.md) - E2E test documentation

---

**Maintainer:** Development Team  
**Architecture Review:** November 2025  
**Next Review:** February 2026

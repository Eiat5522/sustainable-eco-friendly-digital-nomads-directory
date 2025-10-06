# 🧪 Testing Guide - Comprehensive Testing Strategy

**Last Updated**: December 26, 2024  
**Status**: ✅ 120+ E2E TESTS IMPLEMENTED  
**Coverage**: Authentication, RBAC, API Security, User Flows

> **Consolidated from**: `tests/TEST_STRATEGY.md`, `app-next-directory/TESTING_STRATEGY.md`, `docs/app-next-directory/TESTING.md`

---

## 🎯 **Testing Philosophy**

We employ a **comprehensive multi-layered testing approach** ensuring robust, reliable, and maintainable application quality:

1. **End-to-End (E2E) Tests**: Primary focus - simulate real user scenarios across the entire application
2. **Integration Tests**: Verify interactions between components, API services, and external dependencies  
3. **Unit Tests**: Test individual functions, components, and modules in isolation
4. **Security Tests**: Comprehensive authentication, authorization, and RBAC validation

**Primary Testing Framework**: **Playwright** for E2E testing with **Jest** for unit tests

---

## 🛠️ **Tools & Technologies**

### **Primary Testing Stack**

| Tool | Purpose | Coverage |
|------|---------|----------|
| **Playwright** | E2E browser automation | Cross-browser testing (Chromium, Firefox, WebKit) |
| **Jest** | Unit & integration testing | React components, utility functions, API logic |
| **React Testing Library** | Component testing | Component behavior and user interactions |
| **NextAuth Test Utilities** | Authentication testing | Mock authentication flows and session management |
| **ESLint & Prettier** | Code quality | Consistency and best practices enforcement |

### **Testing Environment Setup**

- **Test Database**: Isolated MongoDB instance for testing
- **Mock Services**: Sanity CMS, external APIs, and third-party integrations
- **Browser Automation**: Headless and headed testing modes
- **CI/CD Integration**: Automated test execution on GitHub Actions

---

## 🧪 **Test Suites Overview**

### **Current Test Coverage: 120+ E2E Tests**

Our Playwright test suites are organized by feature and functionality:

#### **1. Authentication Tests** (`tests/e2e/auth/`)
**Coverage**: 25+ test cases

- ✅ **User Registration**: Success and failure scenarios with validation
- ✅ **Login Flows**: Valid/invalid credentials, session management
- ✅ **Password Reset**: Email verification and password update
- ✅ **Session Management**: Timeout, logout, concurrent sessions
- ✅ **Role Assignment**: Default role assignment and validation

```typescript
// Example authentication test
test('successful user login', async ({ page }) => {
  await page.goto('/auth/signin')
  await page.fill('[data-testid="email"]', 'user@example.com')
  await page.fill('[data-testid="password"]', 'validPassword123')
  await page.click('[data-testid="signin-button"]')
  
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  await expect(page).toHaveURL('/dashboard')
})
```

#### **2. Role-Based Access Control (RBAC) Tests** (`tests/e2e/rbac/`)
**Coverage**: 40+ test cases

- ✅ **Role Hierarchy**: Comprehensive testing of 8-tier role system
- ✅ **Page Access Control**: Route protection based on user roles
- ✅ **Feature Permissions**: Component-level access restrictions
- ✅ **API Endpoint Security**: Server-side authorization validation
- ✅ **Admin Functions**: User management and role assignment

```typescript
// Example RBAC test
test('admin dashboard access control', async ({ page }) => {
  // Test unauthorized access
  await loginAs(page, 'user') // Regular user role
  await page.goto('/admin')
  await expect(page.locator('[data-testid="unauthorized"]')).toBeVisible()
  
  // Test authorized access
  await loginAs(page, 'admin')
  await page.goto('/admin')
  await expect(page.locator('[data-testid="admin-panel"]')).toBeVisible()
})
```

#### **3. Listing Management Tests** (`tests/e2e/listings/`)
**Coverage**: 25+ test cases

- ✅ **Listing Creation**: Form validation, image upload, content management
- ✅ **Search & Filtering**: Full-text search, category filters, location-based search
- ✅ **Listing Details**: View functionality, gallery, reviews display
- ✅ **Venue Owner Management**: Own listing management and analytics
- ✅ **Content Moderation**: Admin review and approval workflows

#### **4. User Interface Tests** (`tests/e2e/ui/`)
**Coverage**: 20+ test cases

- ✅ **Navigation**: Menu functionality, breadcrumbs, responsive design
- ✅ **Forms**: Validation, error handling, success states
- ✅ **Interactive Elements**: Carousels, maps, modals, dropdowns
- ✅ **Accessibility**: Keyboard navigation, screen reader compatibility
- ✅ **Performance**: Page load times, image optimization

#### **5. API Security Tests** (`tests/e2e/api/`)
**Coverage**: 15+ test cases

- ✅ **Authentication Required**: Protected endpoints validation
- ✅ **Input Validation**: Malformed requests and XSS prevention
- ✅ **Rate Limiting**: API abuse prevention
- ✅ **CORS Configuration**: Cross-origin request handling
- ✅ **Error Handling**: Proper error responses and status codes

---

## 🎭 **E2E vs Unit Testing Strategy**

### **E2E Testing Approach** (Primary Focus)

**When to Use E2E Tests**:
- ✅ **User Workflows**: Complete user journeys from start to finish
- ✅ **Integration Validation**: Multiple system components working together
- ✅ **Authentication Flows**: Login, registration, role-based access
- ✅ **Business Critical Features**: Core functionality that must always work
- ✅ **Cross-browser Compatibility**: Ensuring consistent behavior

**E2E Best Practices**:
```typescript
// Mock external API responses for predictable testing
test('search listings with controlled data', async ({ page }) => {
  // Mock Sanity API response
  await page.route('**/api/listings*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        listings: mockListingsData,
        pagination: mockPaginationData
      })
    })
  })
  
  await page.goto('/listings')
  await page.fill('[data-testid="search-input"]', 'coworking')
  await page.click('[data-testid="search-button"]')
  
  await expect(page.locator('[data-testid="listing-card"]')).toHaveCount(3)
})
```

### **Unit Testing Approach** (Supporting Coverage)

**When to Use Unit Tests**:
- ✅ **Utility Functions**: Data transformation, validation, formatting
- ✅ **Component Logic**: Isolated component behavior and state management
- ✅ **API Helpers**: Request/response processing, error handling
- ✅ **Business Logic**: Calculations, algorithms, data processing
- ✅ **Hook Testing**: Custom React hooks and side effects

**Unit Test Examples**:
```typescript
// Jest unit test example
describe('formatPrice utility', () => {
  test('formats price range correctly', () => {
    expect(formatPrice('$')).toBe('Budget-friendly')
    expect(formatPrice('$$')).toBe('Moderate')
    expect(formatPrice('$$$')).toBe('Premium')
  })
  
  test('handles invalid input gracefully', () => {
    expect(formatPrice('')).toBe('Price not available')
    expect(formatPrice(null)).toBe('Price not available')
  })
})

// React component test
describe('ListingCard component', () => {
  test('renders listing information correctly', () => {
    render(<ListingCard listing={mockListing} />)
    
    expect(screen.getByText('Eco Coworking Space')).toBeInTheDocument()
    expect(screen.getByText('Barcelona, Spain')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /eco coworking/i })).toBeInTheDocument()
  })
})
```

---

## 🏗️ **Test Architecture & Organization**

### **Directory Structure**

```
app-next-directory/
├── tests/e2e/                     # Playwright E2E tests
│   ├── auth/                      # Authentication tests
│   │   ├── login.spec.ts
│   │   ├── registration.spec.ts
│   │   └── password-reset.spec.ts
│   ├── rbac/                      # Role-based access control
│   │   ├── admin-access.spec.ts
│   │   ├── role-hierarchy.spec.ts
│   │   └── permissions.spec.ts
│   ├── listings/                  # Listing management
│   │   ├── create-listing.spec.ts
│   │   ├── search-filter.spec.ts
│   │   └── listing-details.spec.ts
│   ├── ui/                        # User interface tests
│   │   ├── navigation.spec.ts
│   │   ├── forms.spec.ts
│   │   └── responsive.spec.ts
│   └── api/                       # API security tests
│       ├── authentication.spec.ts
│       ├── authorization.spec.ts
│       └── validation.spec.ts
├── src/__tests__/                 # Jest unit tests
│   ├── components/                # Component tests
│   ├── utils/                     # Utility function tests
│   ├── hooks/                     # Custom hook tests
│   └── api/                       # API helper tests
├── __mocks__/                     # Mock files and test data
│   ├── next-auth.js              # NextAuth mocks
│   ├── sanity-client.js          # Sanity CMS mocks
│   └── test-data/                # Shared test fixtures
└── tests/utils/                   # Test utilities and helpers
    ├── auth-helpers.ts           # Authentication test utilities
    ├── mock-data.ts             # Test data generators
    └── test-setup.ts            # Global test configuration
```

### **Test Configuration Files**

#### **Playwright Configuration** (`playwright.config.ts`)
```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ],
  
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI
  }
})
```

#### **Jest Configuration** (`jest.config.cjs`)
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/utils/test-setup.ts'],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['@swc/jest']
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}'
  ]
}
```

---

## 🔧 **Test Data Management**

### **Mock Data Strategy**

#### **Controlled Test Data**
```typescript
// tests/utils/mock-data.ts
export const mockListingData = {
  id: 'test-listing-1',
  title: 'Test Eco Coworking Space',
  slug: 'test-eco-coworking-space',
  listingType: 'Coworking Space',
  city: {
    name: 'Barcelona',
    slug: 'barcelona',
    country: 'Spain'
  },
  amenities: ['WiFi', 'Coffee', 'Solar Power'],
  sustainabilityFeatures: ['100% Renewable Energy'],
  rating: 4.5,
  priceRange: '$$'
}

export const mockUserData = {
  user: { id: 'user1', email: 'user@test.com', role: 'user' },
  editor: { id: 'editor1', email: 'editor@test.com', role: 'editor' },
  admin: { id: 'admin1', email: 'admin@test.com', role: 'admin' }
}
```

#### **API Mocking Patterns**
```typescript
// Mock Sanity CMS responses
await page.route('**/api/listings', async (route) => {
  const url = new URL(route.request().url())
  const searchQuery = url.searchParams.get('search')
  
  if (searchQuery === 'coworking') {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        listings: [mockListingData],
        pagination: { totalItems: 1, currentPage: 1 }
      })
    })
  } else {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ listings: [], pagination: { totalItems: 0 } })
    })
  }
})
```

---

## 🚀 **Running Tests**

### **E2E Tests (Playwright)**

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test suite
npm run test:e2e -- tests/e2e/auth/

# Run with UI (interactive mode)
npm run test:e2e -- --ui

# Run in headed mode (see browser)
npm run test:e2e -- --headed

# Run specific test file
npm run test:e2e -- tests/e2e/auth/login.spec.ts

# Debug mode
npm run test:e2e -- --debug
```

### **Unit Tests (Jest)**

```bash
# Run all unit tests
npm run test:jest

# Run with coverage report
npm run test:jest -- --coverage

# Run in watch mode
npm run test:jest -- --watch

# Run specific test suite
npm run test:jest -- src/__tests__/components/

# Update snapshots
npm run test:jest -- --updateSnapshot
```

### **Combined Test Commands**

```bash
# Run all tests
npm run test

# CI test suite (used in GitHub Actions)
npm run test:ci

# Test coverage report
npm run test:coverage
```

---

## 🎯 **Test Writing Guidelines**

### **E2E Test Best Practices**

1. **Use Data Test IDs**: Reliable element selection
```typescript
// Good
await page.click('[data-testid="submit-button"]')

// Avoid
await page.click('button:has-text("Submit")')
```

2. **Mock External Dependencies**: Predictable test behavior
```typescript
// Mock API responses for controlled testing
await page.route('**/api/**', mockApiHandler)
```

3. **Test User Journeys**: Complete workflows, not just individual actions
```typescript
test('complete listing creation workflow', async ({ page }) => {
  await loginAs(page, 'editor')
  await navigateToCreateListing(page)
  await fillListingForm(page, mockListingData)
  await submitForm(page)
  await verifyListingCreated(page)
})
```

4. **Use Page Object Model**: Reusable page interactions
```typescript
// tests/utils/pages/listing-page.ts
export class ListingPage {
  constructor(private page: Page) {}
  
  async fillTitle(title: string) {
    await this.page.fill('[data-testid="listing-title"]', title)
  }
  
  async selectListingType(type: string) {
    await this.page.selectOption('[data-testid="listing-type"]', type)
  }
}
```

### **Unit Test Best Practices**

1. **Test Behavior, Not Implementation**: Focus on what the function does
```typescript
// Good - tests behavior
test('should format user name correctly', () => {
  expect(formatUserName('john', 'doe')).toBe('John Doe')
})

// Avoid - tests implementation
test('should call toLowerCase and capitalize', () => {
  const spy = jest.spyOn(String.prototype, 'toLowerCase')
  formatUserName('john', 'doe')
  expect(spy).toHaveBeenCalled()
})
```

2. **Isolate Dependencies**: Use mocks for external dependencies
```typescript
jest.mock('@/lib/sanity-client', () => ({
  getListings: jest.fn().mockResolvedValue(mockListings)
}))
```

3. **Test Edge Cases**: Handle error conditions and boundary values
```typescript
describe('calculateRating', () => {
  test('handles empty reviews array', () => {
    expect(calculateRating([])).toBe(0)
  })
  
  test('handles single review', () => {
    expect(calculateRating([{ rating: 5 }])).toBe(5)
  })
})
```

---

## 🎪 **Authentication Testing Utilities**

### **Test Authentication Helpers**

```typescript
// tests/utils/auth-helpers.ts
export async function loginAs(page: Page, role: string) {
  const userData = mockUserData[role]
  
  // Mock the session
  await page.addInitScript((user) => {
    window.__NEXT_AUTH_SESSION__ = {
      user: user,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }
  }, userData)
  
  // Set authentication cookies
  await page.context().addCookies([
    {
      name: 'next-auth.session-token',
      value: 'mock-jwt-token',
      domain: 'localhost',
      path: '/'
    }
  ])
}

export async function logoutUser(page: Page) {
  await page.context().clearCookies()
  await page.evaluate(() => {
    delete window.__NEXT_AUTH_SESSION__
  })
}
```

### **RBAC Testing Pattern**

```typescript
// Comprehensive role-based access testing
const roleAccessMatrix = [
  { role: 'user', canAccess: ['/profile', '/listings'], cannotAccess: ['/admin', '/dashboard/venue'] },
  { role: 'venueOwner', canAccess: ['/profile', '/listings', '/dashboard/venue'], cannotAccess: ['/admin'] },
  { role: 'admin', canAccess: ['/profile', '/listings', '/admin'], cannotAccess: [] }
]

roleAccessMatrix.forEach(({ role, canAccess, cannotAccess }) => {
  test(`${role} access permissions`, async ({ page }) => {
    await loginAs(page, role)
    
    // Test allowed access
    for (const path of canAccess) {
      await page.goto(path)
      await expect(page.locator('[data-testid="unauthorized"]')).not.toBeVisible()
    }
    
    // Test restricted access
    for (const path of cannotAccess) {
      await page.goto(path)
      await expect(page.locator('[data-testid="unauthorized"]')).toBeVisible()
    }
  })
})
```

---

## 📊 **Test Coverage & Reporting**

### **Coverage Targets**
- **E2E Tests**: 100% critical user journeys covered
- **Unit Tests**: 80%+ code coverage for utilities and business logic
- **Security Tests**: 100% authentication and authorization flows
- **Integration Tests**: All API endpoints and external service integration

### **Reporting & Monitoring**

#### **Playwright Reports**
```bash
# Generate HTML report
npm run test:e2e -- --reporter=html

# Open report in browser
npx playwright show-report
```

#### **Jest Coverage Reports**
```bash
# Generate coverage report
npm run test:jest -- --coverage

# Coverage files generated in coverage/ directory
# - coverage/lcov-report/index.html (detailed HTML report)
# - coverage/coverage-final.json (machine-readable data)
```

#### **CI Integration**
```yaml
# .github/workflows/test.yml
- name: Run E2E Tests
  run: npm run test:e2e
  
- name: Upload Test Results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

---

## 🔗 **Related Documentation**

- **[Authentication & Security](../authentication-security/README.md)** - Security testing implementation
- **[API Documentation](../api/README.md)** - API testing endpoints and examples
- **[Development Guide](../development/README.md)** - Local testing setup and configuration
- **[Deployment Guide](../deployment/README.md)** - Production testing and monitoring

---

## 📞 **Troubleshooting**

### **Common Test Issues**

1. **Flaky Tests**: Use proper waits and stable selectors
2. **Authentication Issues**: Verify mock session setup
3. **API Timeouts**: Increase timeout values for slow operations
4. **Browser Compatibility**: Test across different browsers and devices

### **Debug Strategies**

- **Playwright Debug Mode**: `--debug` flag for step-by-step execution
- **Screenshots on Failure**: Automatic capture for failed tests
- **Video Recording**: Full test execution recording
- **Trace Viewer**: Detailed timeline analysis of test execution

**Testing Status**: ✅ Production Ready  
**Last Updated**: December 26, 2024  
**Next Review**: March 2025
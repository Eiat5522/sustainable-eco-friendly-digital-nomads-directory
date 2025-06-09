# 🧪 Testing Guide - Next.js Application

This document outlines the testing strategies, tools, and practices for the **app-next-directory** (Next.js frontend) workspace. Our goal is to ensure a robust, reliable, and maintainable application through comprehensive testing.

## 📋 Testing Philosophy

We employ a multi-layered testing approach:

1. *End-to-End (E2E) Tests**: Simulate real user scenarios and interactions across the application.
2. *Integration Tests**: Verify interactions between different parts of the application (e.g., components and API services).
3. *Unit Tests**: Test individual functions, components, or modules in isolation. (Planned for broader adoption)

Primary focus is currently on E2E testing to ensure critical user flows are always working.

## 🛠️ Tools & Technologies

* Playwright**: Our primary framework for End-to-End testing.
* H les browser automation, assertions, and test execution.
* S orts cross-browser testing (Chromium, Firefox, WebKit).
* NextAuth.js Utilities**: For mocking and testing authentication flows.
* Jest & React Testing Library**: Planned for unit and integration testing of React components.
* ESLint & Prettier**: For code quality and consistency, which indirectly aids testing.

## 🧪 Test Suites Overview

Our Playwright test suites are organized by feature and functionality. Key test suites include:

* Authentication (`tests/auth.spec.ts`)**:
* U  registration (success and failure cases).
* L n with valid and invalid credentials.
* L ut functionality.
* S ion persistence and expiration.
* P word reset flow (if applicable).
* Role-Based Access Control (RBAC) (`tests/rbac.spec.ts`)**:
* V fies that users with different roles have appropriate access to routes and features.
* T s all 5 user roles: `user`, `editor`, `venueOwner`, `admin`, `superAdmin`.
* E res unauthorized access attempts are correctly handled.
* API Security & Functionality (`tests/auth-api.spec.ts`, `tests/api.spec.ts`)**:
* T s API endpoints related to authentication (e.g., sign-in, sign-up).
* V fies protection of API routes based on authentication and roles.
* T s other critical API endpoints for expected behavior (e.g., contact form, data fetching).
* City Page Tests (`tests/city-pages.spec.ts`)**:
* D mic routing for city pages.
* C ent rendering from Sanity CMS.
* I raction with elements on city pages.
* Core UI & Navigation (`tests/navigation.spec.ts`)**:
* T s main navigation links.
* V fies layout consistency.
* C ks for broken links or UI elements.
* Form Submissions (`tests/forms.spec.ts`)**:
* T s various forms like contact forms, review submissions.
* I udes validation checks and successful submission scenarios.

Refer to the `app-next-directory/tests/` directory for all test files. The `app-next-directory/playwright.config.ts` file contains the Playwright setup.

## 🚀 Running Tests

All test commands should be run from the `app-next-directory` workspace or using the root `package.json` scripts.

### **From `app-next-directory` Workspace**

```bash
# Navigate to the Next.js workspace
cd app-next-directory

# Run all Playwright tests (headless mode by default)
npm run test

# Run tests with the Playwright UI for debugging
npm run test:ui

# Run a specific test file
npx playwright test tests/auth.spec.ts

# Run tests in a specific browser
npx playwright test --browser=firefox

# Run tests with a specific tag (e.g., @critical)
npx playwright test --grep @critical
```

### **Specific Test Suites (Scripts in `app-next-directory/package.json`)**

```bash
# Run authentication tests
npm run test:auth

# Run RBAC tests
npm run test:rbac

# Run API tests
npm run test:api
```

### **From Project Root**

```bash
# Run all Next.js tests
npm run test:next

# Run specific Next.js test suites (if root scripts are configured)
# e.g., npm run test:next:auth
```

## 📈 Test Coverage

We aim for high E2E test coverage for critical user flows, including:

* User registration and login/logout.
* Password management.
* Session management.
* Role-based access to routes and features.
* Core API endpoint authorization and functionality.
* Dynamic page rendering (e.g., city pages).
* Main navigation and UI interactions.
* Form submissions and validation.

Current E2E test suite includes **120+ test cases** covering these areas.

## ✍️ Writing Tests

When adding new features or modifying existing ones, ensure corresponding tests are written or updated.

### **Best Practices for Writing Playwright Tests**

1. *Descriptive Test Names**: Clearly state what the test is verifying.
2. *Atomic Tests**: Each test should verify a single piece of functionality.
3. *Use Page Object Model (POM)**: Consider using POM for better organization and reusability of selectors and actions, especially for larger test suites. (Located in `app-next-directory/tests/poms/` - *if applicable, or plan to implement*)
4. *Reliable Selectors**: Prefer user-facing attributes like `data-testid`, ARIA roles, or text content over brittle CSS or XPath selectors.
5. *Wait for Elements**: Use Playwright's auto-waiting capabilities or explicit waits (`waitForSelector`, `waitForNavigation`) to handle dynamic content.
6. *Assertions**: Use clear and specific assertions (`expect(page.locator(...)).toHaveText(...)`).
7. *Isolate Tests**: Avoid dependencies between tests. Each test should set up its own state or rely on a common setup.
8. *Clean Up**: If a test creates data, ensure it cleans up after itself to avoid affecting other tests.
9. *Debugging**: Utilize Playwright's debugging tools:
    * WDEBUG=1 npm run test` for step-by-step debugging.
    * wait page.pause()` in your test script.
    * aywright Inspector.

## 🌐 Cross-Browser & Responsive Testing

* aywright configuration is set up to run tests across multiple browsers (Chromium, Firefox, WebKit).
* sts are designed to be compatible with different viewport sizes, covering common desktop and mobile resolutions. (Refer to `playwright.config.ts` for viewport settings).

## I/CD Integration

Tests are automatically run as part of our Continuous Integration (CI) pipeline (e.g., using GitHub Actions) on every push and pull request to ensure that no regressions are introduced.

## 🔮 Future Plans

* Component Unit/Integration Tests**: Increase coverage with Jest and React Testing Library for `src/components/` and `src/lib/` functions.
* Visual Regression Testing**: Implement tools to catch unintended UI changes.
* Performance Testing**: Integrate basic performance checks within E2E tests.
* Accessibility Testing**: Incorporate automated accessibility checks (e.g., using `axe-playwright`).

---

🔗 **Related Documentation**:
* [Authentication System (`AUTHENTICATION.md`)](AUTHENTICATION.md)
* [Next.js Frontend README (`README.md`)](README.md)
* [Playwright Documentation](https://playwright.dev/docs/intro)

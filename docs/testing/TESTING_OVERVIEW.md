# Testing Overview - Monorepo

**Last Updated:** November 1, 2025  
**Project:** Sustainable Eco-Friendly Digital Nomads Directory

## Overview

This document provides a high-level overview of testing across the entire monorepo. Each workspace has its own specific testing documentation.

---

## Monorepo Structure

This is a **monorepo** with multiple workspaces:

```
├── app-next-directory/     # Next.js application workspace
├── sanity/                 # Sanity CMS workspace
└── eslint-plugin-sustainable-images/  # Custom ESLint plugin
```

---

## Testing Philosophy

We follow a **comprehensive multi-layered testing approach**:

1. **Unit Tests** - Test individual functions and components in isolation
2. **Integration Tests** - Test interactions between components and services
3. **End-to-End Tests** - Test complete user workflows in real browsers
4. **Visual Tests** - Test UI appearance and layout (optional)

---

## Workspace Testing Documentation

### App Next Directory (Main Application)

**Primary workspace with comprehensive testing**

- **Location:** `app-next-directory/docs/testing/`
- **Framework:** Playwright (E2E) + Jest (Unit/Integration)
- **Test Types:** Unit, Integration, E2E, Accessibility
- **Documentation:** [app-next-directory/docs/testing/README.md](../../app-next-directory/docs/testing/README.md)

**Quick Commands:**
```bash
# From workspace
cd app-next-directory
npm run test:unit
npm run test:integration
npm run test:e2e

# From monorepo root
pnpm --filter app-next-directory test
pnpm --filter app-next-directory test:e2e
```

### Sanity CMS Workspace

**Content Management System workspace**

- **Location:** `sanity/`
- **Framework:** Sanity Studio testing utilities
- **Test Types:** Schema validation, content type tests
- **Documentation:** See `sanity/README.md`

**Quick Commands:**
```bash
cd sanity
npm test  # Run Sanity tests (if configured)
```

### ESLint Plugin

**Custom ESLint plugin workspace**

- **Location:** `eslint-plugin-sustainable-images/`
- **Framework:** Jest (for ESLint rule testing)
- **Test Types:** Rule validation, AST testing
- **Documentation:** See plugin README

---

## Running Tests Across Workspaces

### From Monorepo Root

```bash
# Install all dependencies
pnpm install

# Run tests for all workspaces
pnpm test

# Run tests for specific workspace
pnpm --filter app-next-directory test
pnpm --filter sanity test

# Run specific test type across all workspaces
pnpm -r test:unit          # All unit tests
pnpm -r test:integration   # All integration tests
pnpm -r test:e2e          # All E2E tests
```

### Workspace-Specific Testing

Each workspace has its own testing setup. Navigate to the workspace and run tests:

```bash
# App Next Directory
cd app-next-directory
npm run test:unit
npm run test:integration
npm run test:e2e

# Sanity
cd sanity
npm test
```

---

## Test Infrastructure

### Shared Test Utilities

Common testing utilities and helpers are located in:
- `app-next-directory/tests/helpers/` - Shared test helpers
- `app-next-directory/tests/utils/` - Utility functions

### Mock Data

Test data and mocks are managed per workspace:
- `app-next-directory/__mocks__/` - Mock implementations
- `app-next-directory/tests/helpers/test-data.ts` - Canonical test dataset

### CI/CD Integration

Tests run automatically on:
- Pull request creation/updates
- Push to main branch
- Manual workflow triggers

**CI Configuration:** `.github/workflows/test.yml`

---

## Testing Standards

### Naming Conventions

**Unit Tests:**
- File: `*.test.ts` or `*.test.tsx`
- Location: Co-located with source in `__tests__/` directories

**Integration Tests:**
- File: `*.integration.test.ts` or `*.int.test.ts`
- Location: Co-located with source or in workspace `tests/integration/`

**E2E Tests:**
- File: `*.spec.ts`
- Location: Workspace `tests/e2e/` directory

### Test Organization

```
workspace/
├── src/
│   ├── components/
│   │   └── SearchForm/
│   │       ├── SearchForm.tsx
│   │       └── __tests__/
│   │           ├── SearchForm.test.tsx           # Unit test
│   │           └── SearchForm.integration.test.tsx  # Integration test
│   └── lib/
│       └── __tests__/
│           └── utils.test.ts
└── tests/
    ├── e2e/                    # E2E tests
    ├── helpers/                # Test helpers
    └── utils/                  # Test utilities
```

---

## Best Practices (Monorepo-Wide)

### 1. Workspace Isolation

- Each workspace should have independent tests
- Avoid cross-workspace test dependencies
- Use workspace-specific test configurations

### 2. Shared Dependencies

- Share test utilities when appropriate
- Use consistent testing frameworks across workspaces
- Maintain consistent coding standards

### 3. Test Data Management

- Keep test data workspace-specific
- Use factories for generating test data
- Clean up test data after tests

### 4. Performance

- Run tests in parallel when possible
- Use test filtering to run relevant tests
- Cache dependencies in CI/CD

### 5. Documentation

- Each workspace should have its own testing docs
- Keep shared testing standards here
- Document workspace-specific testing patterns

---

## Test Coverage

### Current Status

**App Next Directory:**
- Unit Tests: ✅ 80%+ coverage
- Integration Tests: ⚠️ Partial coverage
- E2E Tests: ✅ Critical paths covered

**Sanity:**
- Schema Tests: ✅ All schemas validated
- Content Tests: ⚠️ Manual testing primarily

**ESLint Plugin:**
- Rule Tests: ✅ All rules tested

### Coverage Goals

- **Unit Tests:** 80%+ code coverage for all workspaces
- **Integration Tests:** All API endpoints and critical integrations
- **E2E Tests:** All critical user workflows

---

## Common Testing Commands

### Development

```bash
# Run all tests (from root)
pnpm test

# Run tests in watch mode
pnpm --filter app-next-directory test:watch

# Run with coverage
pnpm --filter app-next-directory test:coverage
```

### CI/CD

```bash
# Run CI test suite
pnpm test:ci

# Generate coverage reports
pnpm test:coverage

# Run E2E tests
pnpm test:e2e
```

---

## Troubleshooting

### Common Issues

#### Tests Not Found

**Issue:** pnpm can't find workspace tests
```
No tests found in workspace
```

**Solution:** Ensure workspace has test scripts in `package.json`:
```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --config=jest.config.js"
  }
}
```

#### Dependency Conflicts

**Issue:** Different test framework versions across workspaces

**Solution:** Use workspace protocol in `package.json`:
```json
{
  "devDependencies": {
    "jest": "29.7.0"  // Pin version across workspaces
  }
}
```

#### Port Conflicts

**Issue:** Multiple workspaces trying to use same port

**Solution:** Configure unique ports per workspace:
```javascript
// app-next-directory/playwright.config.ts
webServer: {
  command: 'npm run dev',
  port: 3000
}

// other-workspace/playwright.config.ts
webServer: {
  command: 'npm run dev',
  port: 3001
}
```

---

## Related Documentation

### Workspace-Specific Docs

- [App Next Directory Testing](../../app-next-directory/docs/testing/README.md) - Main application testing
- [Sanity README](../../sanity/README.md) - CMS workspace documentation

### Shared Guides

- [Development Guide](../development/README.md) - Development setup
- [Deployment Guide](../deployment/README.md) - Deployment and production testing
- [Monorepo Workspace Guide](../monorepo/WORKSPACE_GUIDE.md) - Workspace management

### Testing Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

---

## Getting Help

### Documentation

1. Check workspace-specific testing docs
2. Review this shared testing overview
3. Check test examples in the codebase

### Support

- Create an issue for testing problems
- Ask in team chat
- Review existing test files for patterns

---

## Test Strategy by Workspace

### App Next Directory (Next.js)

**Primary Testing Focus:**
- ✅ User authentication and authorization
- ✅ Listing search and filtering
- ✅ Map integration and geolocation
- ✅ API endpoints and data fetching
- ✅ Form validation and submissions
- ✅ Responsive design and accessibility

**Test Distribution:**
- Unit Tests: 60% of test suite
- Integration Tests: 20% of test suite
- E2E Tests: 20% of test suite

### Sanity (CMS)

**Primary Testing Focus:**
- ✅ Schema structure and validation
- ✅ Content type definitions
- ✅ Custom input components
- ⚠️ Content migration scripts

**Test Distribution:**
- Schema Tests: 80%
- Manual Testing: 20%

---

## Continuous Improvement

### Test Review Schedule

- **Weekly:** Review failing tests and flaky tests
- **Monthly:** Review test coverage and gaps
- **Quarterly:** Update testing documentation and strategies

### Metrics to Track

- Test execution time
- Test coverage percentage
- Flaky test rate
- Test failure rate in CI/CD

---

**Maintainer:** Development Team  
**Last Review:** November 1, 2025  
**Next Review:** February 2025

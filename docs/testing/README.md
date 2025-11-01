# Testing Guide - Shared Documentation

**Last Updated:** November 1, 2025  
**Applies To:** All Workspaces

> **Note:** This is the shared testing documentation for the entire monorepo. For workspace-specific testing documentation, see:
> - [App Next Directory Testing](../../app-next-directory/docs/testing/README.md)
> - [Testing Overview](./TESTING_OVERVIEW.md)

---

## Overview

This directory contains **shared testing documentation** that applies across the monorepo. Each workspace may have additional specific testing requirements documented in their respective `docs/testing/` folders.

---

## Testing Philosophy

We employ a **comprehensive multi-layered testing approach** across all workspaces:

1. **Unit Tests** - Fast, isolated tests of individual functions and components
2. **Integration Tests** - Test interactions between components and services  
3. **End-to-End (E2E) Tests** - Simulate real user scenarios in actual browsers
4. **Security Tests** - Authentication, authorization, and security validation

---

## Shared Testing Tools

### Primary Testing Stack

| Tool | Purpose | Workspaces |
|------|---------|-----------|
| **Playwright** | E2E browser automation | app-next-directory |
| **Jest** | Unit & integration testing | app-next-directory, eslint-plugin |
| **React Testing Library** | Component testing | app-next-directory |
| **mongodb-memory-server** | Integration testing | app-next-directory |
| **MSW** | API mocking | app-next-directory |

---

## Documentation Index

### Shared Documentation (This Folder)

- **[TESTING_OVERVIEW.md](./TESTING_OVERVIEW.md)** - Monorepo-wide testing overview
- **[test_refactoring/](./test_refactoring/)** - Historical test refactoring documentation
- **[archive/](./archive/)** - Archived historical reports and outdated guides

### Workspace-Specific Documentation

#### App Next Directory

Located in: `app-next-directory/docs/testing/`

- **[README.md](../../app-next-directory/docs/testing/README.md)** - Complete testing guide
- **[TEST_ARCHITECTURE.md](../../app-next-directory/docs/testing/TEST_ARCHITECTURE.md)** - Architecture and configuration
- **[TEST_SETUP_GUIDE.md](../../app-next-directory/docs/testing/TEST_SETUP_GUIDE.md)** - Setup instructions
- **[TESTING_STRATEGY.md](../../app-next-directory/docs/testing/TESTING_STRATEGY.md)** - E2E vs Unit testing strategy
- **[archive/](../../app-next-directory/docs/testing/archive/)** - Workspace-specific archived docs

Also see workspace test docs:
- **[tests/README.md](../../app-next-directory/tests/README.md)** - Test suite overview
- **[tests/WRITING_GUIDE.md](../../app-next-directory/tests/WRITING_GUIDE.md)** - Writing tests
- **[tests/API-MOCKING.md](../../app-next-directory/tests/API-MOCKING.md)** - API mocking guide

#### Sanity CMS

See: `sanity/README.md`

---

## Quick Start by Workspace

### App Next Directory (Next.js Application)

```bash
cd app-next-directory

# Run all tests
npm test

# Run specific test type
npm run test:unit           # Unit tests (Jest)
npm run test:integration    # Integration tests (Jest + MongoDB)
npm run test:e2e           # E2E tests (Playwright)
```

### From Monorepo Root

```bash
# Run tests for specific workspace
pnpm --filter app-next-directory test
pnpm --filter app-next-directory test:e2e

# Run tests for all workspaces
pnpm test
```

---

## Testing Standards

### Naming Conventions

**Unit Tests:**
- Pattern: `*.test.ts` or `*.test.tsx`
- Location: Co-located with source in `__tests__/` directories

**Integration Tests:**
- Pattern: `*.integration.test.ts` or `*.int.test.ts`
- Location: Co-located with source or workspace `tests/integration/`

**E2E Tests:**
- Pattern: `*.spec.ts`
- Location: Workspace `tests/e2e/` directory

### Test Organization

```
workspace/
├── src/
│   └── components/
│       └── Component/
│           ├── Component.tsx
│           └── __tests__/
│               ├── Component.test.tsx          # Unit test
│               └── Component.integration.test.tsx  # Integration test
└── tests/
    └── e2e/
        └── feature.spec.ts                     # E2E test
```

---

## Best Practices (All Workspaces)

### General Principles

1. ✅ **Test behavior, not implementation**
2. ✅ **Keep tests isolated and independent**
3. ✅ **Use descriptive test names**
4. ✅ **Mock external dependencies**
5. ✅ **Follow AAA pattern**: Arrange, Act, Assert
6. ✅ **Clean up after tests**
7. ❌ **Don't share state between tests**
8. ❌ **Don't test third-party libraries**

### Unit Testing

- Fast execution (< 50ms per test)
- Mock all external dependencies
- Test edge cases and error conditions
- High code coverage for business logic

### Integration Testing

- Use in-memory databases when possible
- Test interactions between real components
- Clean up data between tests
- Extended timeouts for I/O operations

### E2E Testing

- Test critical user workflows
- Mock external APIs for consistency
- Use data-testid attributes for element selection
- Test across multiple browsers and devices
- Handle loading states and animations properly

---

## CI/CD Integration

All tests run automatically on:
- Pull request creation/updates
- Push to main branch
- Manual workflow triggers

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: pnpm test
```

---

## Test Coverage Goals

### Across All Workspaces

- **Unit Tests:** 80%+ code coverage
- **Integration Tests:** All critical API endpoints and integrations
- **E2E Tests:** All critical user workflows

### Current Status

**App Next Directory:**
- Unit Tests: ✅ 82% coverage
- Integration Tests: ✅ All models and API routes
- E2E Tests: ✅ 120+ tests, all critical paths

**Sanity:**
- Schema Tests: ✅ All schemas validated
- Manual Testing: ⚠️ Primarily manual

---

## Troubleshooting

### Common Issues Across Workspaces

#### Tests Not Found

**Issue:** Test runner can't find tests

**Solution:** Check test pattern in configuration:
```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --config=jest.config.js"
  }
}
```

#### Module Resolution Errors

**Issue:** Cannot resolve module paths

**Solution:** Configure path aliases in `jest.config.js` and `tsconfig.json`:
```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1'
}
```

#### Port Conflicts

**Issue:** Multiple tests trying to use same port

**Solution:** Configure unique ports per workspace or use dynamic port allocation

---

## Related Documentation

### Project Documentation

- [Development Guide](../development/README.md)
- [Deployment Guide](../deployment/README.md)
- [Monorepo Workspace Guide](../monorepo/WORKSPACE_GUIDE.md)

### External Resources

- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [MSW Documentation](https://mswjs.io/)

---

## Getting Help

1. Check workspace-specific testing documentation
2. Review test examples in the codebase
3. Search for similar issues in test files
4. Create an issue or ask in team chat

---

**Maintainer:** Development Team  
**Last Review:** November 1, 2025  
**Next Review:** February 2026

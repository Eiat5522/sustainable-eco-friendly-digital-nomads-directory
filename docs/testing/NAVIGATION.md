# Testing Documentation Navigation Guide

**Quick Reference:** Where to find testing documentation  
**Last Updated:** November 1, 2025

---

## Quick Links by Task

### 🚀 I want to run tests

**App Next Directory:**
```bash
cd app-next-directory

# Run all tests
npm test

# Run specific test type
npm run test:unit           # Unit tests
npm run test:integration    # Integration tests
npm run test:e2e           # E2E tests
```

**From monorepo root:**
```bash
pnpm --filter app-next-directory test
pnpm --filter app-next-directory test:e2e
```

📖 **Full commands:** [app-next-directory/docs/testing/README.md](../../app-next-directory/docs/testing/README.md#running-tests)

---

### ✍️ I want to write tests

**Start here:**
1. Read [app-next-directory/tests/WRITING_GUIDE.md](../../app-next-directory/tests/WRITING_GUIDE.md)
2. Check examples in existing test files
3. Review [Testing Best Practices](../../app-next-directory/docs/testing/README.md#best-practices)

**For API mocking:**
- [app-next-directory/tests/API-MOCKING.md](../../app-next-directory/tests/API-MOCKING.md)

---

### 🏗️ I want to understand the test architecture

**Read these in order:**
1. [app-next-directory/docs/testing/README.md](../../app-next-directory/docs/testing/README.md) - Overview
2. [app-next-directory/docs/testing/TEST_ARCHITECTURE.md](../../app-next-directory/docs/testing/TEST_ARCHITECTURE.md) - Detailed architecture
3. [app-next-directory/docs/testing/TEST_SETUP_GUIDE.md](../../app-next-directory/docs/testing/TEST_SETUP_GUIDE.md) - Configuration details

---

### 🔧 I want to set up testing

**Fresh setup:**
1. Follow [app-next-directory/docs/testing/README.md#quick-start](../../app-next-directory/docs/testing/README.md#quick-start)
2. Review [app-next-directory/docs/testing/TEST_ARCHITECTURE.md#test-configuration](../../app-next-directory/docs/testing/TEST_ARCHITECTURE.md#test-configuration)

**Troubleshooting:**
- [app-next-directory/docs/testing/README.md#troubleshooting](../../app-next-directory/docs/testing/README.md#troubleshooting)

---

### 🎯 I want to understand testing strategy

**Strategy documents:**
- [app-next-directory/docs/testing/TESTING_STRATEGY.md](../../app-next-directory/docs/testing/TESTING_STRATEGY.md) - E2E vs Unit testing
- [TESTING_OVERVIEW.md](./TESTING_OVERVIEW.md) - Monorepo-wide strategy

---

### 📊 I want to see test coverage

**Coverage reports:**
- [app-next-directory/docs/testing/TEST_COVERAGE_SUMMARY.md](../../app-next-directory/docs/testing/TEST_COVERAGE_SUMMARY.md)
- [app-next-directory/docs/testing/TEST_COVERAGE_REPORT.md](../../app-next-directory/docs/testing/TEST_COVERAGE_REPORT.md)

**Status by type:**
- Unit Tests: [UNIT_TESTS_SUMMARY.md](../../app-next-directory/docs/testing/UNIT_TESTS_SUMMARY.md)
- API Tests: [API_TEST_COVERAGE_SUMMARY.md](../../app-next-directory/docs/testing/API_TEST_COVERAGE_SUMMARY.md)
- Auth Tests: [AUTH_TEST_CREATION_SUMMARY.md](../../app-next-directory/docs/testing/AUTH_TEST_CREATION_SUMMARY.md)

---

### 🌐 I'm working on a different workspace

**Sanity CMS:**
- See `sanity/README.md`

**ESLint Plugin:**
- See `eslint-plugin-sustainable-images/README.md`

**General monorepo testing:**
- [TESTING_OVERVIEW.md](./TESTING_OVERVIEW.md)

---

### 📜 I need historical information

**Archived documentation:**
- [docs/testing/archive/](./archive/) - Shared historical docs (15 files)
- [app-next-directory/docs/testing/archive/](../../app-next-directory/docs/testing/archive/) - Workspace historical docs (3 files)

**What's in archives:**
- Historical fix reports
- Outdated setup guides
- Completed phase reports
- Resolved issue documentation

---

## Documentation Directory Structure

```
docs/testing/                           # Shared testing documentation
├── README.md                          # Shared testing guide
├── TESTING_OVERVIEW.md                # Monorepo testing overview
├── NAVIGATION.md                      # This file
├── test_refactoring/                  # Historical refactoring docs
└── archive/                           # Archived docs (15 files)

app-next-directory/docs/testing/        # Workspace-specific docs
├── README.md                          # Main testing guide ⭐ START HERE
├── TEST_ARCHITECTURE.md               # Architecture details
├── TEST_SETUP_GUIDE.md                # Setup instructions
├── TESTING_STRATEGY.md                # Testing strategy
├── TEST_SUMMARY.md                    # Testing summary
├── TEST_COVERAGE_SUMMARY.md           # Coverage summary
├── TEST_COVERAGE_REPORT.md            # Detailed coverage
├── UNIT_TESTS_SUMMARY.md              # Unit tests details
├── API_TEST_COVERAGE_SUMMARY.md       # API test coverage
├── AUTH_TEST_CREATION_SUMMARY.md      # Auth testing details
└── archive/                           # Workspace archives (3 files)

app-next-directory/tests/               # Test suite documentation
├── README.md                          # Test suite overview
├── WRITING_GUIDE.md                   # How to write tests
├── API-MOCKING.md                     # API mocking guide
├── PREVIEW_TESTING.md                 # Preview testing
└── TESTING.md                         # Playwright setup
```

---

## Documentation by Purpose

### For New Developers

**Start with these 3 documents:**
1. 📖 [app-next-directory/docs/testing/README.md](../../app-next-directory/docs/testing/README.md)
2. 📖 [app-next-directory/tests/WRITING_GUIDE.md](../../app-next-directory/tests/WRITING_GUIDE.md)
3. 📖 [app-next-directory/tests/README.md](../../app-next-directory/tests/README.md)

### For Understanding Architecture

**Read these:**
1. 📖 [app-next-directory/docs/testing/TEST_ARCHITECTURE.md](../../app-next-directory/docs/testing/TEST_ARCHITECTURE.md)
2. 📖 [app-next-directory/docs/testing/TEST_SETUP_GUIDE.md](../../app-next-directory/docs/testing/TEST_SETUP_GUIDE.md)

### For Writing Specific Test Types

**Unit Tests:**
- [app-next-directory/docs/testing/README.md#unit-tests](../../app-next-directory/docs/testing/README.md#unit-tests)
- [app-next-directory/docs/testing/UNIT_TESTS_SUMMARY.md](../../app-next-directory/docs/testing/UNIT_TESTS_SUMMARY.md)

**Integration Tests:**
- [app-next-directory/docs/testing/README.md#integration-tests](../../app-next-directory/docs/testing/README.md#integration-tests)
- [app-next-directory/docs/testing/TEST_SETUP_GUIDE.md](../../app-next-directory/docs/testing/TEST_SETUP_GUIDE.md)

**E2E Tests:**
- [app-next-directory/tests/TESTING.md](../../app-next-directory/tests/TESTING.md)
- [app-next-directory/tests/WRITING_GUIDE.md](../../app-next-directory/tests/WRITING_GUIDE.md)

### For API Testing

**Documentation:**
- [app-next-directory/tests/API-MOCKING.md](../../app-next-directory/tests/API-MOCKING.md)
- [app-next-directory/docs/testing/API_TEST_COVERAGE_SUMMARY.md](../../app-next-directory/docs/testing/API_TEST_COVERAGE_SUMMARY.md)

---

## FAQs

### Q: Where do I start if I'm new to the project?

**A:** Start with [app-next-directory/docs/testing/README.md](../../app-next-directory/docs/testing/README.md) - it's the comprehensive guide with everything you need.

### Q: I just want to run tests, where are the commands?

**A:** Quick commands are at the top of [app-next-directory/docs/testing/README.md#running-tests](../../app-next-directory/docs/testing/README.md#running-tests)

### Q: How do I write a new test?

**A:** Follow [app-next-directory/tests/WRITING_GUIDE.md](../../app-next-directory/tests/WRITING_GUIDE.md) and look at existing tests for examples.

### Q: What's the difference between unit, integration, and E2E tests?

**A:** See [app-next-directory/docs/testing/README.md#test-types](../../app-next-directory/docs/testing/README.md#test-types) for detailed explanations.

### Q: Where are the old testing docs?

**A:** Archived at [docs/testing/archive/](./archive/) and [app-next-directory/docs/testing/archive/](../../app-next-directory/docs/testing/archive/) with READMEs explaining what's there.

### Q: How do I mock API requests in tests?

**A:** See [app-next-directory/tests/API-MOCKING.md](../../app-next-directory/tests/API-MOCKING.md)

### Q: What's the current test coverage?

**A:** Check [app-next-directory/docs/testing/TEST_COVERAGE_SUMMARY.md](../../app-next-directory/docs/testing/TEST_COVERAGE_SUMMARY.md)

### Q: I'm getting test errors, where do I look?

**A:** [app-next-directory/docs/testing/README.md#troubleshooting](../../app-next-directory/docs/testing/README.md#troubleshooting)

---

## Key Documents Quick Reference

| Purpose | Document | Location |
|---------|----------|----------|
| **Main Guide** | Testing README | [app-next-directory/docs/testing/README.md](../../app-next-directory/docs/testing/README.md) |
| **Architecture** | Test Architecture | [app-next-directory/docs/testing/TEST_ARCHITECTURE.md](../../app-next-directory/docs/testing/TEST_ARCHITECTURE.md) |
| **Writing Tests** | Writing Guide | [app-next-directory/tests/WRITING_GUIDE.md](../../app-next-directory/tests/WRITING_GUIDE.md) |
| **API Mocking** | API Mocking Guide | [app-next-directory/tests/API-MOCKING.md](../../app-next-directory/tests/API-MOCKING.md) |
| **Setup** | Setup Guide | [app-next-directory/docs/testing/TEST_SETUP_GUIDE.md](../../app-next-directory/docs/testing/TEST_SETUP_GUIDE.md) |
| **Strategy** | Testing Strategy | [app-next-directory/docs/testing/TESTING_STRATEGY.md](../../app-next-directory/docs/testing/TESTING_STRATEGY.md) |
| **Coverage** | Coverage Summary | [app-next-directory/docs/testing/TEST_COVERAGE_SUMMARY.md](../../app-next-directory/docs/testing/TEST_COVERAGE_SUMMARY.md) |
| **Monorepo** | Testing Overview | [TESTING_OVERVIEW.md](./TESTING_OVERVIEW.md) |

---

## Getting Help

1. **Search existing documentation** using the links above
2. **Check examples** in existing test files
3. **Review troubleshooting** sections in relevant docs
4. **Create an issue** if you can't find what you need
5. **Ask in team chat** for quick questions

---

**Maintained By:** Development Team  
**Created:** November 1, 2025  
**Purpose:** Help developers find the right testing documentation quickly

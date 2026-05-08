# E2E Auth Tests Refactoring Task

## Objective

Remove mocks from E2E auth tests and move them to integration tests to enable true E2E coverage with real backend endpoints.

## Current Status

- [x] Analyzed current auth.spec.ts file
- [x] Examine testing infrastructure and environment setup
- [x] Review existing integration test structure
- [x] Create new integration test for auth functionality
- [x] Modify E2E test to remove mocks (add TEST_INTEGRATION flag option)
- [x] Configure E2E test environment for real backend testing
- [ ] Update test database configuration if needed
- [ ] Verify E2E tests work with real endpoints
- [ ] Update documentation and test scripts

## Key Changes Required

1. **Remove page.route mocks from auth.spec.ts**
2. **Create integration test file with mocked responses**
3. **Add TEST_INTEGRATION environment flag for optional mocking**
4. **Configure E2E environment for real database/backend**
5. **Ensure proper test isolation and cleanup**

## Files to Modify/Create

- `app-next-directory/tests/e2e/auth.spec.ts` (modify)
- `app-next-directory/src/tests/integration/auth.integration.test.ts` (create)
- `app-next-directory/.env.e2e` (modify)
- `app-next-directory/jest.e2e.config.js` (check/modify)

## Notes

- Cross-browser spec merge conflict resolved in `app-next-directory/tests/e2e/cross-browser/compatibility.spec.ts`.
- Test execution is currently blocked in this environment because terminal sandbox/unsandbox runs are being cancelled before command execution, so E2E verification is still pending.

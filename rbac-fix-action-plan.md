# RBAC E2E Tests Fix Action Plan

## Objective

Fix the 3 failing RBAC e2e tests based on the comprehensive investigation findings that identified authentication and admin dashboard loading issues.

## Failing Tests to Fix

- [ ] 1.1 Regular user cannot access admin routes (38.0s timeout)
- [ ] 1.2 Venue owner cannot access admin routes (14.7s timeout)
- [ ] 1.3 Admin can access admin routes (1.4m timeout)

## Root Causes (from investigation)

1. **Admin Dashboard Loading Timeouts** - Tests timeout waiting for `[data-testid="admin-dashboard"]`
2. **Authentication Flow Issues** - Admin users not properly authenticated in test environment
3. **Test Environment Problems** - Database connections, environment variables, or test fixtures failing

## Implementation Steps

### Phase 1: Analyze Current RBAC Test Implementation

- [ ] 1.1 Examine `tests/e2e/rbac.e2e.spec.ts` to understand current test structure
- [ ] 1.2 Review test data setup and user creation logic
- [ ] 1.3 Identify authentication flow in tests
- [ ] 1.4 Check admin dashboard component for loading issues

### Phase 2: Fix Authentication Issues (HIGH PRIORITY)

- [ ] 2.1 Ensure proper admin user creation in test environment
- [ ] 2.2 Fix authentication flow for test users
- [ ] 2.3 Verify session management in test environment
- [ ] 2.4 Add proper error handling for authentication failures

### Phase 3: Fix Admin Dashboard Loading (HIGH PRIORITY)

- [ ] 3.1 Investigate admin dashboard component loading issues
- [ ] 3.2 Add better error boundaries and loading states
- [ ] 3.3 Improve test waiting conditions and timeouts
- [ ] 3.4 Add debug logging for admin page loading

### Phase 4: Improve Test Reliability

- [ ] 4.1 Add proper test fixture setup
- [ ] 4.2 Implement better error handling in tests
- [ ] 4.3 Add comprehensive debug logging
- [ ] 4.4 Test the fixes with individual test runs

### Phase 5: Validation & Cleanup

- [ ] 5.1 Run all RBAC tests individually to verify fixes
- [ ] 5.2 Run full e2e test suite to ensure no regressions
- [ ] 5.3 Clean up debug code and temporary fixes
- [ ] 5.4 Update documentation if needed

## Success Criteria

- All 3 RBAC tests pass consistently
- Admin dashboard loads reliably in test environment
- Clear error messages when failures occur
- Test execution time under 30 seconds per test

## Key Insights from Investigation

- User roles implementation is CORRECT (camelCase storage, human-readable display)
- The issue is in test infrastructure, not role logic
- Need to focus on authentication flow and admin page loading
- Add proper debugging to identify specific failure points

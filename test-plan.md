# Test Failure Analysis and Workstream Plan

Here is a breakdown of the failing tests, categorized into three workstreams. Each workstream can be assigned to a different agent to work on in parallel.

## Workstream 1: Mocking, Spying, and Assertion Failures

This workstream focuses on tests failing due to incorrect mocking, spying, or basic assertion errors.

### 1.1 `mockedFetch` is not defined in `app/api/featured-listings/route.test.ts` and `app/api/categories/route.test.ts`

*   **Reason for Failure:** The tests are trying to use `mockedFetch.mockResolvedValueOnce` and `mockedFetch.mockRejectedValueOnce`, but `mockedFetch` is undefined. This suggests that the mock for `fetch` is not being set up correctly.
*   **File Paths:**
    *   `app/api/featured-listings/route.test.ts`
    *   `app/api/categories/route.test.ts`
*   **Potential Solution:**
    1.  Ensure that `fetch` is being mocked correctly in the test setup. A common way to do this is to use `jest.spyOn(global, 'fetch')` or to use a library like `jest-fetch-mock`.
    2.  If `jest-fetch-mock` is used, ensure it is set up correctly in `jest.setup.ts`.
    3.  If `jest.spyOn` is used, ensure it is called before the tests that use it.

### 1.2 `expect(jest.fn()).toHaveBeenCalledWith(...)` failures

*   **Reason for Failure:** The mock functions are not being called with the expected arguments. This could be due to a bug in the code that is being tested, or the expected arguments in the test are incorrect.
*   **File Paths:**
    *   `src/lib/__tests__/email.test.ts`
    *   `src/lib/mongodb/__tests__/init.test.ts`
    *   `src/lib/__tests__/mongoose-cache.test.ts`
*   **Potential Solution:**
    1.  Inspect the code being tested to see what arguments are being passed to the mock function.
    2.  Update the test to expect the correct arguments.
    3.  If the code is incorrect, fix the code to pass the correct arguments.

### 1.3 `expect(received).toBe(expected)` and `expect(received).toEqual(expected)` failures

*   **Reason for Failure:** The actual output of the code is not matching the expected output.
*   **File Paths:**
    *   `app/api/admin/settings/__tests__/route.test.ts`
    *   `src/lib/sanity/cached-client.test.ts`
    *   `app/api/sanity-test/__tests__/route.test.ts`
*   **Potential Solution:**
    1.  Debug the code to see why the actual output is different from the expected output.
    2.  If the code is incorrect, fix the code to produce the correct output.
    3.  If the expected output is incorrect, update the test with the correct expected output.

## Workstream 2: Sanity and API Integration Failures

This workstream focuses on tests failing due to issues with the Sanity client and other API integrations.

### 2.1 `TypeError: (0 , _client.client) is not a function` in `src/lib/sanity/cached-client.test.ts`

*   **Reason for Failure:** The test is trying to call `client()` as a function, but it is not a function. This suggests that the Sanity client is not being initialized correctly in the test environment.
*   **File Path:** `src/lib/sanity/cached-client.test.ts`
*   **Potential Solution:**
    1.  Inspect the `src/lib/sanity/client.ts` file to see how the Sanity client is exported.
    2.  Ensure that the test is importing and using the client correctly. It seems the client is an object, not a function, so the code should be `client.fetch` instead of `client().fetch`.

### 2.2 `TypeError: (0 , _route._createAnalyticsHandler) is not a function` in `app/api/user/analytics/route.test.ts`

*   **Reason for Failure:** The test is trying to call `createAnalyticsHandler` as a function, but it is not a function. The `_` prefix suggests it might be a private/internal function that is not exported.
*   **File Path:** `app/api/user/analytics/route.test.ts`
*   **Potential Solution:**
    1.  Inspect the `app/api/user/analytics/route.ts` file to see how `createAnalyticsHandler` is defined and exported.
    2.  If it is not exported, the test should not be trying to call it directly. Instead, the test should call the exported `GET` handler and assert its behavior.

### 2.3 Failures in `src/lib/sanity/data.test.ts`

*   **Reason for Failure:** These tests are failing for a variety of reasons, including `mockClient.fetch` not being called, and `toEqual` assertions failing. This suggests a problem with how the Sanity client is being mocked in these tests.
*   **File Path:** `src/lib/sanity/data.test.ts`
*   **Potential Solution:**
    1.  Review the mock implementation for the Sanity client in this test file.
    2.  Ensure that the mock is correctly set up to return the expected data for each test case.
    3.  Debug the `getListingData` function to see why it is not behaving as expected.

## Workstream 3: Configuration and Module Resolution Failures

This workstream focuses on fixing tests that are failing due to configuration issues, especially with Jest's `moduleNameMapper`.

### 3.1 `Cannot find module '../../src/utils/theme'` in `app/__tests__/layout-utils.test.ts`

*   **Reason for Failure:** The test is trying to import a module using a relative path, but Jest is unable to resolve it. This is likely due to an incorrect `moduleNameMapper` configuration.
*   **File Path:** `app/__tests__/layout-utils.test.ts`
*   **Potential Solution:**
    1.  Review the `jest.config.cjs` file to ensure that the `moduleNameMapper` is configured correctly to resolve aliases like `@/`.
    2.  The error message shows that the module is being looked for in `app/utils/theme`, which is incorrect. The `@/` alias should point to the `src` directory.

### 3.2 `Could not locate module @/utils/theme` in `app/layout.test.tsx`

*   **Reason for Failure:** Similar to the previous error, Jest is unable to resolve the `@/utils/theme` module alias.
*   **File Path:** `app/layout.test.tsx`
*   **Potential Solution:**
    1.  The `moduleNameMapper` in `jest.config.cjs` needs to be corrected to properly resolve the `@/` alias to the `src` directory.
    2.  The error message shows that it is trying to resolve to `.../app-next-directory/src/utils/theme` and `.../app-next-directory/app/utils/theme`. The second path is incorrect. The `moduleNameMapper` should only point to the `src` directory.

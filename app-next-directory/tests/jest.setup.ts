// Jest setup: capture console.error and console.warn and fail tests on unexpected logs
// Add this file to your Jest config under `setupFilesAfterEnv` to enable global behavior:
// "setupFilesAfterEnv": ["<rootDir>/tests/jest.setup.ts"]

// Globally mock the structured logger so tests can assert console behavior consistently.
// This uses the manual mock in __mocks__/lib/logger.js
jest.mock('@/lib/logger');

/**
 * Whitelist of expected console messages that should not fail tests.
 * Keep this list minimal to avoid masking real issues.
 */
const WHITELIST: RegExp[] = [
  // Auth components rendered outside SessionProvider context (expected in isolated tests)
  /\[auth\] Header rendered without SessionProvider/,
  // React test utility warnings about state updates (can be noisy in async tests)
  /act\(.*\) warning/i,
  // Network errors from mocked fetch calls in geocoding/API tests
  /Failed to fetch/,
  // HTTP error responses from test API stubs
  /Request failed with status/,
];

let _errorSpy: jest.SpyInstance<void, Parameters<typeof console.error>> | null = null;
let _warnSpy: jest.SpyInstance<void, Parameters<typeof console.warn>> | null = null;

beforeEach(() => {
  // Spy and swallow real console output to keep test output clean; we re-run expectations in afterEach.
  _errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  _warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  try {
    const errorCalls =
      _errorSpy?.mock.calls.map((c: Parameters<typeof console.error>) => c.join(' ')) || [];
    const warnCalls =
      _warnSpy?.mock.calls.map((c: Parameters<typeof console.warn>) => c.join(' ')) || [];

    const unexpectedErrors = errorCalls.filter(
      (msg: string) => !WHITELIST.some(rx => rx.test(msg))
    );
    const unexpectedWarns = warnCalls.filter((msg: string) => !WHITELIST.some(rx => rx.test(msg)));

    if (unexpectedErrors.length || unexpectedWarns.length) {
      const lines: string[] = [];
      if (unexpectedErrors.length) {
        lines.push('Unexpected console.error:');
        lines.push(...unexpectedErrors.map(s => `  ${s}`));
      }
      if (unexpectedWarns.length) {
        lines.push('Unexpected console.warn:');
        lines.push(...unexpectedWarns.map(s => `  ${s}`));
      }

      // Re-emit the collected unexpected messages to stderr for visibility in CI logs
      // and then throw to fail the test so the issue can be investigated.
      // NOTE: we restore the spies first to avoid swallowing the re-emitted messages.
      _errorSpy?.mockRestore();
      _warnSpy?.mockRestore();

      // Print full details for triage
      // eslint-disable-next-line no-console
      console.error('\n' + lines.join('\n'));

      throw new Error(
        `Test emitted unexpected console output (${unexpectedErrors.length} error(s), ${unexpectedWarns.length} warn(s)). See logs above.`
      );
    }
  } finally {
    _errorSpy?.mockRestore();
    _warnSpy?.mockRestore();
    _errorSpy = null;
    _warnSpy = null;
  }
});

// Export helpers to allow tests or scripts to extend the whitelist if needed.
export const addToConsoleWhitelist = (rx: RegExp) => {
  WHITELIST.push(rx);
};

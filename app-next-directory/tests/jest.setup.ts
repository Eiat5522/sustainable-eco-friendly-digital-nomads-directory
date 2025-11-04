// Jest setup: capture console.error and console.warn and fail tests on unexpected logs
// Add this file to your Jest config under `setupFilesAfterEnv` to enable global behavior:
// "setupFilesAfterEnv": ["<rootDir>/tests/jest.setup.ts"]

// TODO: Update the whitelist with real noisy messages observed in the test output.
const WHITELIST: RegExp[] = [
  // Known/expected warnings (add entries below)
  /\[auth\] Header rendered without SessionProvider/, // from Header test (expected)
  /act\(.*\) warning/i, // React act warning (sometimes noisy)
  /Failed to fetch/, // network stubs in tests
  /Request failed with status/,
];

let _errorSpy: jest.SpyInstance<typeof console.error> | null = null;
let _warnSpy: jest.SpyInstance<typeof console.warn> | null = null;

beforeEach(() => {
  // Spy and swallow real console output to keep test output clean; we re-run expectations in afterEach.
  _errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  _warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  try {
    const errorCalls = _errorSpy?.mock.calls.map((c: any[]) => c.join(' ')) || [];
    const warnCalls = _warnSpy?.mock.calls.map((c: any[]) => c.join(' ')) || [];

    const unexpectedErrors = errorCalls.filter((msg: string) => !WHITELIST.some(rx => rx.test(msg)));
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

      throw new Error(`Test emitted unexpected console output (${unexpectedErrors.length} error(s), ${unexpectedWarns.length} warn(s)). See logs above.`);
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

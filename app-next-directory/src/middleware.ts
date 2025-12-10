// Compatibility wrapper: re-export the new `proxy` implementation.
// Re-export only the runtime middleware for compatibility.
export { proxy as middleware } from './proxy';

// Maintain CJS compatibility for tests that import the legacy module.
if (typeof module !== 'undefined' && module.exports) {
   
  // Expose the proxy export as `middleware` for older CommonJS imports
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  module.exports = { middleware: require('./proxy').proxy };
}

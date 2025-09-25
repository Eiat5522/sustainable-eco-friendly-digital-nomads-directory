/**
 * Simple test to verify Jest extension configuration
 */
describe('VSCode Jest Extension Test', () => {
  it('should work with VSCode Jest extension', () => {
    expect(2 + 2).toBe(4);
  });

  it('should have access to Node.js environment', () => {
    expect(process).toBeDefined();
    expect(process.version).toBeDefined();
  });
});
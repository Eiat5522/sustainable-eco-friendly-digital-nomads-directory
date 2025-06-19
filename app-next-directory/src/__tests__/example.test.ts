import { describe, it, expect } from '@jest/globals';

describe('Jest Setup Test', () => {
  it('should run a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle strings', () => {
    expect('hello world').toContain('world');
  });

  it('should handle arrays', () => {
    const fruits = ['apple', 'banana', 'orange'];
    expect(fruits).toHaveLength(3);
    expect(fruits).toContain('banana');
  });
});

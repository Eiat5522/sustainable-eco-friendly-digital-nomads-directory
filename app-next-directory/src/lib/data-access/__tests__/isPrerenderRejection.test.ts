/**
 * Unit tests for isPrerenderRejection.ts
 * Tests the utility for detecting prerender rejection errors
 */

import { isPrerenderRejection } from '../isPrerenderRejection';

describe('isPrerenderRejection', () => {
  it('should return false for null or undefined', () => {
    expect(isPrerenderRejection(null)).toBe(false);
    expect(isPrerenderRejection(undefined)).toBe(false);
  });

  it('should detect "During prerendering" in error message', () => {
    const error = new Error('During prerendering, something went wrong');
    expect(isPrerenderRejection(error)).toBe(true);
  });

  it('should detect "During prerendering" in object with message property', () => {
    const error = { message: 'During prerendering, something went wrong' };
    expect(isPrerenderRejection(error)).toBe(true);
  });

  it('should detect HANGING_PROMISE_REJECTION digest', () => {
    const error = { digest: 'HANGING_PROMISE_REJECTION' };
    expect(isPrerenderRejection(error)).toBe(true);
  });

  it('should detect DYNAMIC_SERVER_USAGE digest', () => {
    const error = { digest: 'DYNAMIC_SERVER_USAGE' };
    expect(isPrerenderRejection(error)).toBe(true);
  });

  it('should return false for regular errors without prerender indicators', () => {
    const error = new Error('Regular error');
    expect(isPrerenderRejection(error)).toBe(false);
  });

  it('should return false for object with non-matching digest', () => {
    const error = { digest: 'SOME_OTHER_DIGEST' };
    expect(isPrerenderRejection(error)).toBe(false);
  });

  it('should return false for string errors', () => {
    expect(isPrerenderRejection('some error string')).toBe(false);
  });

  it('should return false for number errors', () => {
    expect(isPrerenderRejection(123)).toBe(false);
  });

  it('should handle objects with message being non-string', () => {
    const error = { message: 123 };
    expect(isPrerenderRejection(error)).toBe(false);
  });

  it('should handle error with both message and digest', () => {
    const error = new Error('During prerendering, something went wrong');
    (error as any).digest = 'DYNAMIC_SERVER_USAGE';
    expect(isPrerenderRejection(error)).toBe(true);
  });

  it('should handle error with non-prerender message but prerender digest', () => {
    const error = { message: 'Regular error', digest: 'HANGING_PROMISE_REJECTION' };
    expect(isPrerenderRejection(error)).toBe(true);
  });

  it('should handle empty message', () => {
    const error = { message: '' };
    expect(isPrerenderRejection(error)).toBe(false);
  });

  it('should handle empty object', () => {
    expect(isPrerenderRejection({})).toBe(false);
  });
});

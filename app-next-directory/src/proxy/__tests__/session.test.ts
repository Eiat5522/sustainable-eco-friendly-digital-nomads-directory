import { sessionMiddleware } from '../session';

describe('session middleware', () => {
  describe('sessionMiddleware', () => {
    it('should return an object with next method', () => {
      const result = sessionMiddleware();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('next');
      expect(typeof result.next).toBe('function');
    });

    it('should return empty object when next is called', () => {
      const result = sessionMiddleware();
      const nextResult = result.next();

      expect(nextResult).toBeDefined();
      expect(nextResult).toEqual({});
    });

    it('should be callable multiple times', () => {
      const result1 = sessionMiddleware();
      const result2 = sessionMiddleware();

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result1.next()).toEqual({});
      expect(result2.next()).toEqual({});
    });

    it('should handle multiple invocations of next', () => {
      const result = sessionMiddleware();

      const next1 = result.next();
      const next2 = result.next();

      expect(next1).toEqual({});
      expect(next2).toEqual({});
    });
  });
});

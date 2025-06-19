import { describe, it, expect } from '@jest/globals';
import { cn } from '../utils';

describe('Utils', () => {
  describe('cn function', () => {
    it('should merge class names correctly', () => {
      const result = cn('px-2 py-1', 'text-sm');
      expect(result).toBe('px-2 py-1 text-sm');
    });

    it('should handle conditional classes', () => {
      const result = cn('base-class', true && 'conditional-class', false && 'hidden-class');
      expect(result).toBe('base-class conditional-class');
    });

    it('should merge conflicting Tailwind classes', () => {
      const result = cn('px-2 px-4', 'py-1 py-2');
      expect(result).toBe('px-4 py-2');
    });

    it('should handle arrays of classes', () => {
      const result = cn(['class1', 'class2'], 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('should handle undefined and null values', () => {
      const result = cn('base', undefined, null, 'end');
      expect(result).toBe('base end');
    });

    it('should handle empty strings', () => {
      const result = cn('', 'valid-class', '');
      expect(result).toBe('valid-class');
    });

    it('should handle objects with conditional classes', () => {
      const result = cn({
        'active': true,
        'disabled': false,
        'loading': true
      });
      expect(result).toBe('active loading');
    });
  });
});

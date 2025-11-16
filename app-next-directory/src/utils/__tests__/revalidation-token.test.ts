/**
 * Test Suite for Revalidation Token Helper
 * Tests covering:
 * 1. Token retrieval from environment variables
 * 2. Casing normalization (REVALIDATION_TOKEN vs revalidationToken)
 * 3. Fail-fast behavior when token is required but missing
 * 4. Token validation
 * 5. Caching behavior
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  getRevalidationToken,
  validateRevalidationToken,
  _resetTokenCache,
} from '../revalidation-token';

describe('Revalidation Token Helper', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment for each test
    process.env = { ...originalEnv };
    _resetTokenCache();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getRevalidationToken', () => {
    describe('Token retrieval with conventional naming', () => {
      it('should retrieve token from REVALIDATION_TOKEN (uppercase)', () => {
        process.env.REVALIDATION_TOKEN = 'test-token-123';
        
        const token = getRevalidationToken({ required: false });
        
        expect(token).toBe('test-token-123');
      });

      it('should prefer REVALIDATION_TOKEN over revalidationToken', () => {
        process.env.REVALIDATION_TOKEN = 'uppercase-token';
        process.env.revalidationToken = 'lowercase-token';
        
        const token = getRevalidationToken({ required: false });
        
        expect(token).toBe('uppercase-token');
      });

      it('should fall back to revalidationToken if REVALIDATION_TOKEN is not set', () => {
        process.env.revalidationToken = 'legacy-token';
        
        const token = getRevalidationToken({ required: false });
        
        expect(token).toBe('legacy-token');
      });
    });

    describe('Token caching', () => {
      it('should cache token after first retrieval', () => {
        process.env.REVALIDATION_TOKEN = 'initial-token';
        
        const firstCall = getRevalidationToken({ required: false });
        
        // Change env var after first call
        process.env.REVALIDATION_TOKEN = 'changed-token';
        
        const secondCall = getRevalidationToken({ required: false });
        
        expect(firstCall).toBe('initial-token');
        expect(secondCall).toBe('initial-token'); // Should return cached value
      });

      it('should allow cache reset in test environment', () => {
        process.env.NODE_ENV = 'test';
        process.env.REVALIDATION_TOKEN = 'first-token';
        
        getRevalidationToken({ required: false });
        
        _resetTokenCache();
        
        process.env.REVALIDATION_TOKEN = 'second-token';
        const token = getRevalidationToken({ required: false });
        
        expect(token).toBe('second-token');
      });
    });

    describe('Fail-fast behavior', () => {
      it('should throw error when token is required but missing in production', () => {
        process.env.NODE_ENV = 'production';
        delete process.env.REVALIDATION_TOKEN;
        delete process.env.revalidationToken;
        
        expect(() => {
          getRevalidationToken();
        }).toThrow('REVALIDATION_TOKEN is required but not configured');
      });

      it('should throw error when required=true and token is missing', () => {
        delete process.env.REVALIDATION_TOKEN;
        delete process.env.revalidationToken;
        
        expect(() => {
          getRevalidationToken({ required: true });
        }).toThrow('REVALIDATION_TOKEN is required but not configured');
      });

      it('should return null when required=false and token is missing', () => {
        delete process.env.REVALIDATION_TOKEN;
        delete process.env.revalidationToken;
        
        const token = getRevalidationToken({ required: false });
        
        expect(token).toBeNull();
      });

      it('should not throw in development when token is missing by default', () => {
        process.env.NODE_ENV = 'development';
        delete process.env.REVALIDATION_TOKEN;
        delete process.env.revalidationToken;
        
        expect(() => {
          getRevalidationToken();
        }).not.toThrow();
      });

      it('should not throw in test when token is missing by default', () => {
        process.env.NODE_ENV = 'test';
        delete process.env.REVALIDATION_TOKEN;
        delete process.env.revalidationToken;
        
        expect(() => {
          getRevalidationToken();
        }).not.toThrow();
      });
    });

    describe('Error messages', () => {
      it('should provide helpful error message when token is missing', () => {
        delete process.env.REVALIDATION_TOKEN;
        delete process.env.revalidationToken;
        
        expect(() => {
          getRevalidationToken({ required: true });
        }).toThrow(/REVALIDATION_TOKEN.*environment variable/);
      });
    });
  });

  describe('validateRevalidationToken', () => {
    beforeEach(() => {
      process.env.REVALIDATION_TOKEN = 'valid-secret-token';
    });

    it('should return true for valid token', () => {
      const isValid = validateRevalidationToken('valid-secret-token');
      
      expect(isValid).toBe(true);
    });

    it('should return false for invalid token', () => {
      const isValid = validateRevalidationToken('wrong-token');
      
      expect(isValid).toBe(false);
    });

    it('should return false for null token', () => {
      const isValid = validateRevalidationToken(null);
      
      expect(isValid).toBe(false);
    });

    it('should return false for undefined token', () => {
      const isValid = validateRevalidationToken(undefined);
      
      expect(isValid).toBe(false);
    });

    it('should return false for empty string', () => {
      const isValid = validateRevalidationToken('');
      
      expect(isValid).toBe(false);
    });

    it('should be case-sensitive', () => {
      const isValid = validateRevalidationToken('VALID-SECRET-TOKEN');
      
      expect(isValid).toBe(false);
    });

    it('should return false when no token is configured', () => {
      delete process.env.REVALIDATION_TOKEN;
      delete process.env.revalidationToken;
      _resetTokenCache();
      
      const isValid = validateRevalidationToken('any-token');
      
      expect(isValid).toBe(false);
    });

    it('should work with legacy revalidationToken env var', () => {
      delete process.env.REVALIDATION_TOKEN;
      process.env.revalidationToken = 'legacy-token';
      _resetTokenCache();
      
      const isValid = validateRevalidationToken('legacy-token');
      
      expect(isValid).toBe(true);
    });
  });

  describe('Cache reset protection', () => {
    it('should throw error when _resetTokenCache is called outside test environment', () => {
      process.env.NODE_ENV = 'production';
      
      expect(() => {
        _resetTokenCache();
      }).toThrow('_resetTokenCache can only be called in test environment');
    });

    it('should not throw in test environment', () => {
      process.env.NODE_ENV = 'test';
      
      expect(() => {
        _resetTokenCache();
      }).not.toThrow();
    });
  });
});

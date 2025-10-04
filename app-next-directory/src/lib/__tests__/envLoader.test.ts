import { describe, it, expect, beforeEach } from '@jest/globals';

describe('envLoader', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables and module cache
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getTestDbUri', () => {
    it('should return the TEST_MONGODB_URI from environment', () => {
      process.env.TEST_MONGODB_URI = 'mongodb://test:test@localhost:27017/test';
      
      const { getTestDbUri } = require('../envLoader');
      const result = getTestDbUri();
      
      expect(result).toBe('mongodb://test:test@localhost:27017/test');
    });

    it('should throw error when TEST_MONGODB_URI is missing', () => {
      delete process.env.TEST_MONGODB_URI;
      
      const { getTestDbUri } = require('../envLoader');
      
      expect(() => getTestDbUri()).toThrow('Invalid environment variables');
    });

    it('should throw error when TEST_MONGODB_URI is not a valid URL', () => {
      process.env.TEST_MONGODB_URI = 'not-a-valid-url';
      
      const { getTestDbUri } = require('../envLoader');
      
      expect(() => getTestDbUri()).toThrow('Invalid environment variables');
    });

    it('should throw error when TEST_MONGODB_URI is empty string', () => {
      process.env.TEST_MONGODB_URI = '';
      
      const { getTestDbUri } = require('../envLoader');
      
      expect(() => getTestDbUri()).toThrow('Invalid environment variables');
    });

    it('should cache the environment variables after first load', () => {
      process.env.TEST_MONGODB_URI = 'mongodb://test:test@localhost:27017/test';
      
      const { getTestDbUri } = require('../envLoader');
      const result1 = getTestDbUri();
      
      // Change env after first load
      process.env.TEST_MONGODB_URI = 'mongodb://different:different@localhost:27017/different';
      
      // Should still return cached value
      const result2 = getTestDbUri();
      
      expect(result1).toBe(result2);
      expect(result1).toBe('mongodb://test:test@localhost:27017/test');
    });

    it('should accept mongodb:// protocol', () => {
      process.env.TEST_MONGODB_URI = 'mongodb://localhost:27017/testdb';
      
      const { getTestDbUri } = require('../envLoader');
      const result = getTestDbUri();
      
      expect(result).toBe('mongodb://localhost:27017/testdb');
    });

    it('should accept mongodb+srv:// protocol', () => {
      process.env.TEST_MONGODB_URI = 'mongodb+srv://user:pass@cluster.mongodb.net/dbname';
      
      const { getTestDbUri } = require('../envLoader');
      const result = getTestDbUri();
      
      expect(result).toBe('mongodb+srv://user:pass@cluster.mongodb.net/dbname');
    });

    it('should handle MongoDB URI with auth credentials', () => {
      process.env.TEST_MONGODB_URI = 'mongodb://username:password@localhost:27017/testdb?authSource=admin';
      
      const { getTestDbUri } = require('../envLoader');
      const result = getTestDbUri();
      
      expect(result).toBe('mongodb://username:password@localhost:27017/testdb?authSource=admin');
    });

    it('should handle MongoDB Atlas URI', () => {
      process.env.TEST_MONGODB_URI = 'mongodb+srv://user:pass@cluster0.mongodb.net/mydb?retryWrites=true&w=majority';
      
      const { getTestDbUri } = require('../envLoader');
      const result = getTestDbUri();
      
      expect(result).toBe('mongodb+srv://user:pass@cluster0.mongodb.net/mydb?retryWrites=true&w=majority');
    });
  });
});

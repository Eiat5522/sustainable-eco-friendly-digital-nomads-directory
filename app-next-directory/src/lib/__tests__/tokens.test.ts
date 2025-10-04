import { describe, it, expect, beforeEach } from '@jest/globals';
import { generateToken, hashToken, minutesFromNow } from '../tokens';
import { createHash } from 'node:crypto';

describe('tokens', () => {
  describe('generateToken', () => {
    it('should generate a token with raw and hash properties', () => {
      const token = generateToken();
      expect(token).toHaveProperty('raw');
      expect(token).toHaveProperty('hash');
      expect(typeof token.raw).toBe('string');
      expect(typeof token.hash).toBe('string');
    });

    it('should generate unique tokens on each call', () => {
      const token1 = generateToken();
      const token2 = generateToken();
      expect(token1.raw).not.toBe(token2.raw);
      expect(token1.hash).not.toBe(token2.hash);
    });

    it('should generate 64-character hex string for raw token', () => {
      const token = generateToken();
      expect(token.raw).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should generate 64-character hex string for hash', () => {
      const token = generateToken();
      expect(token.hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should generate hash that matches hashToken output', () => {
      const token = generateToken();
      const expectedHash = hashToken(token.raw);
      expect(token.hash).toBe(expectedHash);
    });
  });

  describe('hashToken', () => {
    it('should hash a token string consistently', () => {
      const raw = 'test-token-string';
      const hash1 = hashToken(raw);
      const hash2 = hashToken(raw);
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = hashToken('token1');
      const hash2 = hashToken('token2');
      expect(hash1).not.toBe(hash2);
    });

    it('should generate SHA-256 hash', () => {
      const raw = 'test-token';
      const hash = hashToken(raw);
      const expectedHash = createHash('sha256').update(raw).digest('hex');
      expect(hash).toBe(expectedHash);
    });

    it('should handle empty string', () => {
      const hash = hashToken('');
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
      expect(hash).toBe(createHash('sha256').update('').digest('hex'));
    });

    it('should handle special characters', () => {
      const raw = 'token-with-!@#$%^&*()_+={}[]|\\:";\'<>?,./';
      const hash = hashToken(raw);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('minutesFromNow', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return a Date object', () => {
      const result = minutesFromNow(5);
      expect(result).toBeInstanceOf(Date);
    });

    it('should calculate time 5 minutes from now', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      jest.setSystemTime(now);
      
      const result = minutesFromNow(5);
      const expected = new Date('2024-01-01T12:05:00Z');
      
      expect(result.getTime()).toBe(expected.getTime());
    });

    it('should calculate time 60 minutes from now', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      jest.setSystemTime(now);
      
      const result = minutesFromNow(60);
      const expected = new Date('2024-01-01T13:00:00Z');
      
      expect(result.getTime()).toBe(expected.getTime());
    });

    it('should handle negative minutes (time in the past)', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      jest.setSystemTime(now);
      
      const result = minutesFromNow(-10);
      const expected = new Date('2024-01-01T11:50:00Z');
      
      expect(result.getTime()).toBe(expected.getTime());
    });

    it('should handle zero minutes', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      jest.setSystemTime(now);
      
      const result = minutesFromNow(0);
      
      expect(result.getTime()).toBe(now.getTime());
    });

    it('should handle fractional minutes', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      jest.setSystemTime(now);
      
      const result = minutesFromNow(0.5); // 30 seconds
      const expected = new Date('2024-01-01T12:00:30Z');
      
      expect(result.getTime()).toBe(expected.getTime());
    });

    it('should handle large minute values', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      jest.setSystemTime(now);
      
      const result = minutesFromNow(1440); // 24 hours
      const expected = new Date('2024-01-02T12:00:00Z');
      
      expect(result.getTime()).toBe(expected.getTime());
    });
  });
});

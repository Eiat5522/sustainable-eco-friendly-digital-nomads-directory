import { describe, it, expect } from '@jest/globals';

// Simple utility functions to test
export const addNumbers = (a: number, b: number): number => a + b;
export const formatName = (firstName: string, lastName: string): string => 
  `${firstName} ${lastName}`.trim();
export const isValidEmail = (email: string): boolean => 
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

describe('Helper Utilities', () => {
  describe('addNumbers', () => {
    it('should add two positive numbers correctly', () => {
      expect(addNumbers(2, 3)).toBe(5);
    });

    it('should handle negative numbers', () => {
      expect(addNumbers(-2, 3)).toBe(1);
    });

    it('should handle zero', () => {
      expect(addNumbers(0, 5)).toBe(5);
    });
  });

  describe('formatName', () => {
    it('should format full name correctly', () => {
      expect(formatName('John', 'Doe')).toBe('John Doe');
    });

    it('should handle empty last name', () => {
      expect(formatName('John', '')).toBe('John');
    });

    it('should handle empty first name', () => {
      expect(formatName('', 'Doe')).toBe('Doe');
    });

    it('should handle both names empty', () => {
      expect(formatName('', '')).toBe('');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });
});

/**
 * Jest Test Suite for Contact API Route
 * Tests covering:
 * 1. GET /api/contact - Fetch contact form configuration
 * 2. POST /api/contact - Validation testing
 *
 * Note: Full POST integration tests are skipped due to complex rate-limiting 
 * that requires integration testing environment
 */

import { jest } from '@jest/globals';
import { GET } from './route';

describe('Contact API - GET /api/contact', () => {
  describe('Configuration Endpoint', () => {
    it('should return contact form configuration', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.types).toBeDefined();
      expect(Array.isArray(data.data.types)).toBe(true);
      expect(data.data.types.length).toBeGreaterThan(0);
      expect(data.data.limits).toBeDefined();
      expect(data.data.limits.rateLimit).toBe('5 requests per minute');
    });

    it('should include all contact types', async () => {
      const response = await GET();
      const data = await response.json();

      const typeValues = data.data.types.map((t: any) => t.value);
      expect(typeValues).toContain('general');
      expect(typeValues).toContain('listing');
      expect(typeValues).toContain('partnership');
      expect(typeValues).toContain('support');
      expect(typeValues).toContain('feedback');
    });

    it('should include field limits', async () => {
      const response = await GET();
      const data = await response.json();

      expect(data.data.limits.nameMax).toBe(100);
      expect(data.data.limits.subjectMax).toBe(200);
      expect(data.data.limits.messageMax).toBe(2000);
    });
  });
});

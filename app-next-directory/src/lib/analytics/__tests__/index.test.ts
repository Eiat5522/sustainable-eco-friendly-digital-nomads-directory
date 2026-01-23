/**
 * Unit tests for src/lib/analytics/index.ts
 * Tests analytics module exports
 */

import * as analyticsIndex from '../index';

describe('src/lib/analytics/index', () => {
  describe('Provider Exports', () => {
    it('should export AnalyticsProvider component', () => {
      expect(analyticsIndex.AnalyticsProvider).toBeDefined();
      expect(typeof analyticsIndex.AnalyticsProvider).toBe('function');
    });
  });

  describe('Analytics Instance Export', () => {
    it('should export analytics instance', () => {
      expect(analyticsIndex.analytics).toBeDefined();
      expect(typeof analyticsIndex.analytics).toBe('object');
    });
  });

  describe('Module Organization', () => {
    it('should have both provider and analytics instance', () => {
      const exports = Object.keys(analyticsIndex);
      expect(exports).toContain('AnalyticsProvider');
      expect(exports).toContain('analytics');
    });
  });
});

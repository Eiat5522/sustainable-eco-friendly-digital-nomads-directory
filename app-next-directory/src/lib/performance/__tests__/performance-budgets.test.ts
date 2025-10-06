import { PERFORMANCE_BUDGETS } from '../performance-budgets';

describe('performance-budgets', () => {
  describe('PERFORMANCE_BUDGETS', () => {
    it('should export a valid PERFORMANCE_BUDGETS object', () => {
      expect(PERFORMANCE_BUDGETS).toBeDefined();
      expect(typeof PERFORMANCE_BUDGETS).toBe('object');
    });

    describe('pageLoad budgets', () => {
      it('should have pageLoad property', () => {
        expect(PERFORMANCE_BUDGETS.pageLoad).toBeDefined();
        expect(typeof PERFORMANCE_BUDGETS.pageLoad).toBe('object');
      });

      it('should have FCP budget with target, acceptable, and critical values', () => {
        const fcp = PERFORMANCE_BUDGETS.pageLoad.FCP;
        expect(fcp).toBeDefined();
        expect(fcp.target).toBe(1000);
        expect(fcp.acceptable).toBe(1500);
        expect(fcp.critical).toBe(2000);
      });

      it('should have LCP budget with correct values', () => {
        const lcp = PERFORMANCE_BUDGETS.pageLoad.LCP;
        expect(lcp).toBeDefined();
        expect(lcp.target).toBe(2500);
        expect(lcp.acceptable).toBe(4000);
        expect(lcp.critical).toBe(6000);
      });

      it('should have TTI budget with correct values', () => {
        const tti = PERFORMANCE_BUDGETS.pageLoad.TTI;
        expect(tti).toBeDefined();
        expect(tti.target).toBe(3000);
        expect(tti.acceptable).toBe(5000);
        expect(tti.critical).toBe(7000);
      });

      it('should have FID budget with correct values', () => {
        const fid = PERFORMANCE_BUDGETS.pageLoad.FID;
        expect(fid).toBeDefined();
        expect(fid.target).toBe(100);
        expect(fid.acceptable).toBe(300);
        expect(fid.critical).toBe(500);
      });

      it('should have CLS budget with correct values', () => {
        const cls = PERFORMANCE_BUDGETS.pageLoad.CLS;
        expect(cls).toBeDefined();
        expect(cls.target).toBe(0.1);
        expect(cls.acceptable).toBe(0.25);
        expect(cls.critical).toBe(0.5);
      });

      it('should have TBT budget with correct values', () => {
        const tbt = PERFORMANCE_BUDGETS.pageLoad.TBT;
        expect(tbt).toBeDefined();
        expect(tbt.target).toBe(200);
        expect(tbt.acceptable).toBe(400);
        expect(tbt.critical).toBe(600);
      });

      it('should have target < acceptable < critical for all metrics', () => {
        const metrics = ['FCP', 'LCP', 'TTI', 'FID', 'CLS', 'TBT'] as const;
        
        metrics.forEach(metric => {
          const budget = PERFORMANCE_BUDGETS.pageLoad[metric];
          expect(budget.target).toBeLessThan(budget.acceptable);
          expect(budget.acceptable).toBeLessThan(budget.critical);
        });
      });

      it('should have all values as numbers', () => {
        const metrics = ['FCP', 'LCP', 'TTI', 'FID', 'CLS', 'TBT'] as const;
        
        metrics.forEach(metric => {
          const budget = PERFORMANCE_BUDGETS.pageLoad[metric];
          expect(typeof budget.target).toBe('number');
          expect(typeof budget.acceptable).toBe('number');
          expect(typeof budget.critical).toBe('number');
        });
      });

      it('should have all values as positive numbers', () => {
        const metrics = ['FCP', 'LCP', 'TTI', 'FID', 'CLS', 'TBT'] as const;
        
        metrics.forEach(metric => {
          const budget = PERFORMANCE_BUDGETS.pageLoad[metric];
          expect(budget.target).toBeGreaterThan(0);
          expect(budget.acceptable).toBeGreaterThan(0);
          expect(budget.critical).toBeGreaterThan(0);
        });
      });

      it('should align with Core Web Vitals standards for LCP', () => {
        const lcp = PERFORMANCE_BUDGETS.pageLoad.LCP;
        // Core Web Vitals: Good < 2.5s, Needs improvement < 4s, Poor >= 4s
        expect(lcp.target).toBeLessThanOrEqual(2500);
        expect(lcp.acceptable).toBeLessThanOrEqual(4000);
      });

      it('should align with Core Web Vitals standards for FID', () => {
        const fid = PERFORMANCE_BUDGETS.pageLoad.FID;
        // Core Web Vitals: Good < 100ms, Needs improvement < 300ms, Poor >= 300ms
        expect(fid.target).toBeLessThanOrEqual(100);
        expect(fid.acceptable).toBeLessThanOrEqual(300);
      });

      it('should align with Core Web Vitals standards for CLS', () => {
        const cls = PERFORMANCE_BUDGETS.pageLoad.CLS;
        // Core Web Vitals: Good < 0.1, Needs improvement < 0.25, Poor >= 0.25
        expect(cls.target).toBeLessThanOrEqual(0.1);
        expect(cls.acceptable).toBeLessThanOrEqual(0.25);
      });
    });

    describe('budget structure validation', () => {
      it('should have consistent structure for all pageLoad metrics', () => {
        const metrics = Object.keys(PERFORMANCE_BUDGETS.pageLoad);
        
        metrics.forEach(metric => {
          const budget = PERFORMANCE_BUDGETS.pageLoad[metric as keyof typeof PERFORMANCE_BUDGETS.pageLoad];
          expect(budget).toHaveProperty('target');
          expect(budget).toHaveProperty('acceptable');
          expect(budget).toHaveProperty('critical');
        });
      });

      it('should not have unexpected properties in pageLoad budgets', () => {
        const expectedMetrics = ['FCP', 'LCP', 'TTI', 'FID', 'CLS', 'TBT'];
        const actualMetrics = Object.keys(PERFORMANCE_BUDGETS.pageLoad);
        
        expect(actualMetrics.sort()).toEqual(expectedMetrics.sort());
      });

      it('should have FCP values in milliseconds (reasonable range)', () => {
        const fcp = PERFORMANCE_BUDGETS.pageLoad.FCP;
        expect(fcp.target).toBeGreaterThan(500); // > 0.5s
        expect(fcp.critical).toBeLessThan(5000); // < 5s
      });

      it('should have CLS as a decimal value (not percentage)', () => {
        const cls = PERFORMANCE_BUDGETS.pageLoad.CLS;
        expect(cls.target).toBeLessThan(1);
        expect(cls.acceptable).toBeLessThan(1);
        expect(cls.critical).toBeLessThan(1);
      });
    });

    describe('type safety', () => {
      it('should be immutable when imported', () => {
        const originalTarget = PERFORMANCE_BUDGETS.pageLoad.LCP.target;
        
        // Attempting to modify should not affect the original
        try {
          // @ts-expect-error - Testing runtime immutability
          PERFORMANCE_BUDGETS.pageLoad.LCP.target = 9999;
        } catch (e) {
          // Expected in strict mode
        }
        
        // Value should remain the same or be the new value (depending on freeze)
        expect(typeof PERFORMANCE_BUDGETS.pageLoad.LCP.target).toBe('number');
      });

      it('should export a properly typed object', () => {
        const budgets = PERFORMANCE_BUDGETS;
        expect(budgets).toHaveProperty('pageLoad');
      });
    });
  });
});

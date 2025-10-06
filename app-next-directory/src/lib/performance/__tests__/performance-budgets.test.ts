import { PERFORMANCE_BUDGETS } from '../performance-budgets.ts';

describe('performance-budgets', () => {
  describe('PERFORMANCE_BUDGETS', () => {
    it('should export PERFORMANCE_BUDGETS object', () => {
      expect(PERFORMANCE_BUDGETS).toBeDefined();
      expect(typeof PERFORMANCE_BUDGETS).toBe('object');
    });

    it('should have pageLoad property', () => {
      expect(PERFORMANCE_BUDGETS.pageLoad).toBeDefined();
      expect(typeof PERFORMANCE_BUDGETS.pageLoad).toBe('object');
    });

    describe('pageLoad budgets', () => {
      it('should define FCP budget', () => {
        const fcp = PERFORMANCE_BUDGETS.pageLoad.FCP;
        expect(fcp).toBeDefined();
        expect(fcp.target).toBe(1000);
        expect(fcp.acceptable).toBe(1500);
        expect(fcp.critical).toBe(2000);
      });

      it('should define LCP budget', () => {
        const lcp = PERFORMANCE_BUDGETS.pageLoad.LCP;
        expect(lcp).toBeDefined();
        expect(lcp.target).toBe(2500);
        expect(lcp.acceptable).toBe(4000);
        expect(lcp.critical).toBe(6000);
      });

      it('should define TTI budget', () => {
        const tti = PERFORMANCE_BUDGETS.pageLoad.TTI;
        expect(tti).toBeDefined();
        expect(tti.target).toBe(3000);
        expect(tti.acceptable).toBe(5000);
        expect(tti.critical).toBe(7000);
      });

      it('should define FID budget', () => {
        const fid = PERFORMANCE_BUDGETS.pageLoad.FID;
        expect(fid).toBeDefined();
        expect(fid.target).toBe(100);
        expect(fid.acceptable).toBe(300);
        expect(fid.critical).toBe(500);
      });

      it('should define CLS budget', () => {
        const cls = PERFORMANCE_BUDGETS.pageLoad.CLS;
        expect(cls).toBeDefined();
        expect(cls.target).toBe(0.1);
        expect(cls.acceptable).toBe(0.25);
        expect(cls.critical).toBe(0.5);
      });

      it('should define TBT budget', () => {
        const tbt = PERFORMANCE_BUDGETS.pageLoad.TBT;
        expect(tbt).toBeDefined();
        expect(tbt.target).toBe(200);
        expect(tbt.acceptable).toBe(400);
        expect(tbt.critical).toBe(600);
      });

      it('should have target < acceptable < critical for all metrics', () => {
        Object.entries(PERFORMANCE_BUDGETS.pageLoad).forEach(([key, value]) => {
          expect(value.target).toBeLessThan(value.acceptable);
          expect(value.acceptable).toBeLessThan(value.critical);
        });
      });

      it('should have positive values for all budgets', () => {
        Object.values(PERFORMANCE_BUDGETS.pageLoad).forEach((budget) => {
          expect(budget.target).toBeGreaterThan(0);
          expect(budget.acceptable).toBeGreaterThan(0);
          expect(budget.critical).toBeGreaterThan(0);
        });
      });
    });
  });
});

export const PERFORMANCE_BUDGETS: {
  pageLoad: Record<string, { target: number; acceptable: number; critical: number }>;
} = {
  pageLoad: {
    FCP: { target: 1000, acceptable: 1500, critical: 2000 },
    LCP: { target: 2500, acceptable: 4000, critical: 6000 },
    TTI: { target: 3000, acceptable: 5000, critical: 7000 },
    FID: { target: 100, acceptable: 300, critical: 500 },
    CLS: { target: 0.1, acceptable: 0.25, critical: 0.5 },
    TBT: { target: 200, acceptable: 400, critical: 600 },
  },
};

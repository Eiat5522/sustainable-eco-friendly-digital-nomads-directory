export type Budget = { target: number; acceptable: number; critical: number };

export const PERFORMANCE_BUDGETS: {
  pageLoad: Record<string, Budget>;
  resourceSize?: Record<string, Budget>;
  apiResponses?: Record<string, Budget>;
  components?: Record<string, unknown>;
  serverResources?: Record<string, unknown>;
} = {
  pageLoad: {
    FCP: { target: 1500, acceptable: 2500, critical: 3500 },
    LCP: { target: 2500, acceptable: 4000, critical: 6000 },
    TTI: { target: 3500, acceptable: 5000, critical: 7500 },
    FID: { target: 100, acceptable: 300, critical: 500 },
    CLS: { target: 0.1, acceptable: 0.25, critical: 0.5 },
    TBT: { target: 200, acceptable: 500, critical: 800 },
  },
  resourceSize: {
    total: { target: 900, acceptable: 1200, critical: 1500 },
    javascript: { target: 350, acceptable: 500, critical: 700 },
    css: { target: 75, acceptable: 100, critical: 150 },
    images: { target: 400, acceptable: 600, critical: 800 },
    fonts: { target: 75, acceptable: 125, critical: 200 },
  },
  apiResponses: {
    listings: { target: 300, acceptable: 600, critical: 1000 },
    search: { target: 500, acceptable: 800, critical: 1200 },
    mapData: { target: 400, acceptable: 700, critical: 1100 },
    userProfile: { target: 250, acceptable: 500, critical: 800 },
  },
  components: {
    mapRendering: {
      initialLoad: { target: 800, acceptable: 1200, critical: 2000 },
      panZoom: { target: 50, acceptable: 100, critical: 200 },
      markerClustering: { target: 100, acceptable: 200, critical: 300 },
    },
    imageLoading: {
      listingThumbnail: { target: 200, acceptable: 500, critical: 800 },
      heroImage: { target: 500, acceptable: 800, critical: 1200 },
      lazyLoadedImage: { target: 300, acceptable: 600, critical: 1000 },
    },
    ssrCaching: {
      cacheHit: { target: 80, acceptable: 150, critical: 300 },
      cacheMiss: { target: 1000, acceptable: 1500, critical: 2500 },
      cacheInvalidation: { target: 200, acceptable: 400, critical: 600 },
    },
  },
  serverResources: {
    cpuUtilization: { target: 40, acceptable: 60, critical: 80 },
    memoryUtilization: { target: 50, acceptable: 70, critical: 85 },
    diskIOUtilization: { target: 30, acceptable: 50, critical: 75 },
  },
};

export function evaluatePerformanceMetric(category: string, metric: string, value: number): 'good' | 'needs-improvement' | 'poor' | 'unknown' {
  if (!PERFORMANCE_BUDGETS[category as keyof typeof PERFORMANCE_BUDGETS] || !(PERFORMANCE_BUDGETS as any)[category][metric]) {
    console.warn(`Unknown performance metric: ${category}.${metric}`);
    return 'unknown';
  }

  const budget: any = (PERFORMANCE_BUDGETS as any)[category][metric];

  if (metric === 'CLS') {
    if (value <= budget.target) return 'good';
    if (value <= budget.acceptable) return 'needs-improvement';
    return 'poor';
  }

  if (value <= budget.target) return 'good';
  if (value <= budget.acceptable) return 'needs-improvement';
  return 'poor';
}

export function getMetricThresholds(category: string, metric: string) {
  if (!PERFORMANCE_BUDGETS[category as keyof typeof PERFORMANCE_BUDGETS] || !(PERFORMANCE_BUDGETS as any)[category][metric]) {
    console.warn(`Unknown performance metric: ${category}.${metric}`);
    return null;
  }
  return (PERFORMANCE_BUDGETS as any)[category][metric];
}


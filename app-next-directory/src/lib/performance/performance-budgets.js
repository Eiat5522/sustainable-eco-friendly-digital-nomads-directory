/**
 * Performance Budgets for Sustainable Eco-Friendly Digital Nomads Directory
 * These budgets define the target performance metrics for the MVP launch.
 * 
 * @version 1.0.0
 * @date May 15, 2025
 */

const PERFORMANCE_BUDGETS = {
  // Page Load Metrics (measured in milliseconds)
  pageLoad: {
    // First Contentful Paint - when first text/image is painted
    FCP: {
      target: 1500, // ms
      acceptable: 2500, // ms
      critical: 3500, // ms
    },
    // Largest Contentful Paint - when largest text/image is painted
    LCP: {
      target: 2500, // ms
      acceptable: 4000, // ms
      critical: 6000, // ms
    },
    // Time to Interactive - when page becomes fully interactive
    TTI: {
      target: 3500, // ms
      acceptable: 5000, // ms
      critical: 7500, // ms
    },
    // First Input Delay - time from user input to response
    FID: {
      target: 100, // ms
      acceptable: 300, // ms
      critical: 500, // ms
    },
    // Cumulative Layout Shift - measure of visual stability
    CLS: {
      target: 0.1, // score (unitless)
      acceptable: 0.25, // score
      critical: 0.5, // score
    },
    // Total Blocking Time
    TBT: {
      target: 200, // ms
      acceptable: 500, // ms
      critical: 800, // ms
    },
  },
  
  // Resource Size Budgets (measured in KB)
  resourceSize: {
    total: {
      target: 900, // KB
      acceptable: 1200, // KB
      critical: 1500, // KB
    },
    javascript: {
      target: 350, // KB
      acceptable: 500, // KB
      critical: 700, // KB
    },
    css: {
      target: 75, // KB
      acceptable: 100, // KB
      critical: 150, // KB
    },
    images: {
      target: 400, // KB
      acceptable: 600, // KB
      critical: 800, // KB
    },
    fonts: {
      target: 75, // KB
      acceptable: 125, // KB
      critical: 200, // KB
    },
  },
  
  // API Response Times (measured in milliseconds)
  apiResponses: {
    listings: {
      target: 300, // ms
      acceptable: 600, // ms
      critical: 1000, // ms
    },
    search: {
      target: 500, // ms
      acceptable: 800, // ms
      critical: 1200, // ms
    },
    mapData: {
      target: 400, // ms
      acceptable: 700, // ms
      critical: 1100, // ms
    },
    userProfile: {
      target: 250, // ms
      acceptable: 500, // ms
      critical: 800, // ms
    },
  },
  
  // Component-Specific Performance Metrics
  components: {
    // Map Rendering Time
    mapRendering: {
      initialLoad: {
        target: 800, // ms
        acceptable: 1200, // ms
        critical: 2000, // ms
      },
      panZoom: {
        target: 50, // ms
        acceptable: 100, // ms
        critical: 200, // ms
      },
      markerClustering: {
        target: 100, // ms
        acceptable: 200, // ms
        critical: 300, // ms
      },
    },
    
    // Image Loading and Processing
    imageLoading: {
      listingThumbnail: {
        target: 200, // ms
        acceptable: 500, // ms
        critical: 800, // ms
      },
      heroImage: {
        target: 500, // ms
        acceptable: 800, // ms
        critical: 1200, // ms
      },
      lazyLoadedImage: {
        target: 300, // ms
        acceptable: 600, // ms
        critical: 1000, // ms
      },
    },
    
    // SSR Caching Performance
    ssrCaching: {
      cacheHit: {
        target: 80, // ms
        acceptable: 150, // ms
        critical: 300, // ms
      },
      cacheMiss: {
        target: 1000, // ms
        acceptable: 1500, // ms
        critical: 2500, // ms
      },
      cacheInvalidation: {
        target: 200, // ms
        acceptable: 400, // ms
        critical: 600, // ms
      },
    },
  },
  
  // Server Resource Utilization Metrics
  serverResources: {
    cpuUtilization: {
      target: 40, // percent
      acceptable: 60, // percent
      critical: 80, // percent
    },
    memoryUtilization: {
      target: 50, // percent
      acceptable: 70, // percent
      critical: 85, // percent
    },
    diskIOUtilization: {
      target: 30, // percent
      acceptable: 50, // percent
      critical: 75, // percent
    },
  },
};

/**
 * Returns the appropriate threshold status based on a measured value and budget category
 * @param {string} category - The main budget category (e.g., 'pageLoad', 'apiResponses')
 * @param {string} metric - The specific metric (e.g., 'FCP', 'listings')
 * @param {number} value - The measured value
 * @returns {string} - 'good', 'needs-improvement', or 'poor'
 */
function evaluatePerformanceMetric(category, metric, value) {
  if (!PERFORMANCE_BUDGETS[category] || !PERFORMANCE_BUDGETS[category][metric]) {
    console.warn(`Unknown performance metric: ${category}.${metric}`);
    return 'unknown';
  }

  const budget = PERFORMANCE_BUDGETS[category][metric];
  
  // For CLS lower is better, same for all other metrics
  if (metric === 'CLS') {
    if (value <= budget.target) return 'good';
    if (value <= budget.acceptable) return 'needs-improvement';
    return 'poor';
  }
  
  // For normal metrics (where lower is better)
  if (value <= budget.target) return 'good';
  if (value <= budget.acceptable) return 'needs-improvement';
  return 'poor';
}

/**
 * Utility to get the threshold values for a specific metric
 */
function getMetricThresholds(category, metric) {
  if (!PERFORMANCE_BUDGETS[category] || !PERFORMANCE_BUDGETS[category][metric]) {
    console.warn(`Unknown performance metric: ${category}.${metric}`);
    return null;
  }
  
  return PERFORMANCE_BUDGETS[category][metric];
}

module.exports = {
  PERFORMANCE_BUDGETS,
  evaluatePerformanceMetric,
  getMetricThresholds
};

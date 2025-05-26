'use client';

/**
 * Performance Dashboard Component
 * 
 * Visualizes performance metrics and budget thresholds
 * Only available in development mode for internal use
 * 
 * @version 1.0.0
 * @date May 15, 2025
 */

import { useState, useEffect } from 'react';
import { PERFORMANCE_BUDGETS } from '@/lib/performance/performance-budgets';

export default function PerformanceDashboard() {
  const [webVitals, setWebVitals] = useState({});
  const [resourceSizes, setResourceSizes] = useState({});
  const [apiResponses, setApiResponses] = useState({});
  const [showDashboard, setShowDashboard] = useState(true);

  useEffect(() => {
    // This would normally fetch real data from our API
    // For now, we'll simulate data for demonstration purposes

    // Mock Core Web Vitals data
    setWebVitals({
      FCP: { value: 1200, status: 'good' }, // First Contentful Paint
      LCP: { value: 2100, status: 'good' }, // Largest Contentful Paint
      CLS: { value: 0.08, status: 'good' }, // Cumulative Layout Shift
      FID: { value: 95, status: 'good' },   // First Input Delay
      TTI: { value: 3200, status: 'good' }, // Time to Interactive
      TBT: { value: 180, status: 'good' },  // Total Blocking Time
    });

    // Mock Resource Sizes data (in KB)
    setResourceSizes({
      javascript: { value: 320, status: 'good' },
      css: { value: 65, status: 'good' },
      images: { value: 380, status: 'good' },
      fonts: { value: 70, status: 'good' },
      total: { value: 835, status: 'good' },
    });

    // Mock API Response Times (in ms)
    setApiResponses({
      listings: { value: 280, status: 'good' },
      search: { value: 480, status: 'good' },
      mapData: { value: 380, status: 'good' },
      userProfile: { value: 220, status: 'good' },
    });
  }, []);

  // Helper function to determine the status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'good': return 'bg-green-100 text-green-800';
      case 'needs-improvement': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to format value with unit
  const formatValue = (value, metric) => {
    if (metric === 'CLS') return value.toFixed(2); // CLS is unitless
    if (Object.keys(resourceSizes).includes(metric)) return `${value} KB`;
    return `${value} ms`; // Default to milliseconds for timing metrics
  };

  // Calculate percentage against budget
  const calculatePercentage = (category, metric, value) => {
    if (!PERFORMANCE_BUDGETS[category] || !PERFORMANCE_BUDGETS[category][metric]) {
      return 50; // Default to 50% if no budget exists
    }

    const budget = PERFORMANCE_BUDGETS[category][metric];
    const target = budget.target;
    const critical = budget.critical;
    
    // For CLS lower is better, same for all other metrics
    if (metric === 'CLS') {
      if (value <= target) return (value / target) * 100;
      if (value <= critical) return ((value - target) / (critical - target) * 50) + 50;
      return 100;
    }
    
    // For normal metrics (where lower is better)
    if (value <= target) return (value / target) * 50;
    if (value <= critical) return ((value - target) / (critical - target) * 50) + 50;
    return 100;
  };

  if (!showDashboard) {
    return (
      <button 
        onClick={() => setShowDashboard(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-md shadow-md z-50"
      >
        Show Performance Dashboard
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Performance Dashboard</h2>
            <button 
              onClick={() => setShowDashboard(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-8">
            {/* Core Web Vitals */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Core Web Vitals</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(webVitals).map(([metric, { value, status }]) => (
                  <div key={metric} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-700">{metric}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                        {status}
                      </span>
                    </div>
                    <div className="text-2xl font-bold mb-2">{formatValue(value, metric)}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          status === 'good' ? 'bg-green-500' : 
                          status === 'needs-improvement' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${calculatePercentage('pageLoad', metric, value)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Target: {formatValue(PERFORMANCE_BUDGETS.pageLoad[metric]?.target || 0, metric)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resource Sizes */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Resource Sizes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(resourceSizes).map(([metric, { value, status }]) => (
                  <div key={metric} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-700">{metric}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                        {status}
                      </span>
                    </div>
                    <div className="text-2xl font-bold mb-2">{formatValue(value, metric)}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          status === 'good' ? 'bg-green-500' : 
                          status === 'needs-improvement' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${calculatePercentage('resourceSize', metric, value)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Target: {PERFORMANCE_BUDGETS.resourceSize[metric]?.target || 0} KB
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* API Response Times */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-700">API Response Times</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(apiResponses).map(([endpoint, { value, status }]) => (
                  <div key={endpoint} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-700">{endpoint}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                        {status}
                      </span>
                    </div>
                    <div className="text-2xl font-bold mb-2">{value} ms</div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          status === 'good' ? 'bg-green-500' : 
                          status === 'needs-improvement' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${calculatePercentage('apiResponses', endpoint, value)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Target: {PERFORMANCE_BUDGETS.apiResponses[endpoint]?.target || 0} ms
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer with help text */}
        <div className="bg-gray-50 px-6 py-3 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Only visible in development mode • Data refreshes every 60 seconds
          </div>
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View Full Report
          </button>
        </div>
      </div>
    </div>
  );
}

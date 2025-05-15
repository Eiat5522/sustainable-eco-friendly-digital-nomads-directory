/**
 * API Route for collecting performance metrics
 * 
 * @version 1.0.0
 * @date May 15, 2025
 */

import { PERFORMANCE_BUDGETS } from '@/lib/performance/performance-budgets';
import { processMetricForAlert } from '@/lib/performance/alert-service';

// Function to store performance metrics in database
async function storePerformanceData(metricData) {
  try {
    // In development, we'll just log the data
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    
    // In production, we would store in a database
    // Example using MongoDB (we would import the client first)
    // const { db } = await connectToDatabase();
    // await db.collection('performance_metrics').insertOne({
    //   ...metricData,
    //   createdAt: new Date()
    // });
    
    return true;
  } catch (error) {
    console.error('[Performance Storage] Error storing metric:', error);
    return false;
  }
}

export async function POST(request) {
  try {
    // Parse the metrics data from the request
    const metricsData = await request.json();
    
    // Add timestamp and user agent
    const enhancedData = {
      ...metricsData,
      timestamp: Date.now(),
      userAgent: request.headers.get('user-agent') || 'Unknown',
      ip: request.headers.get('x-forwarded-for') || request.ip || 'Unknown',
    };
    
    // Check metrics against thresholds and add status
    if (metricsData.name && PERFORMANCE_BUDGETS.pageLoad[metricsData.name]) {
      const budget = PERFORMANCE_BUDGETS.pageLoad[metricsData.name];
      enhancedData.status = 
        metricsData.value <= budget.target ? 'good' :
        metricsData.value <= budget.acceptable ? 'needs-improvement' :
        'poor';
        
      // Process alerts for metrics that exceed thresholds
      if (enhancedData.status === 'needs-improvement' || enhancedData.status === 'poor') {
        await processMetricForAlert('pageLoad', metricsData.name, metricsData.value, {
          page: metricsData.page || 'Unknown',
          source: 'web-vitals',
          userAgent: enhancedData.userAgent,
          timestamp: enhancedData.timestamp,
          delta: metricsData.delta,
          id: metricsData.id
        });
      }
    }
    
    // Store the performance data for analysis
    await storePerformanceData(enhancedData);
      // In a production environment, we would:
    // 1. Store this data in a database
    // 2. Forward it to a monitoring service
    // 3. Or log it to an analytics platform
    
    // For now, we'll just log it in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Performance Metrics]', enhancedData);
    }
    
    // Return success response
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error processing performance metrics:', error);
    
    // Return error response
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to process metrics' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Only accept POST requests for this endpoint
export const config = {
  api: {
    bodyParser: true,
  },
};

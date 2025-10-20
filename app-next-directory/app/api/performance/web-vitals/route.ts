/**
 * API Route for collecting performance metrics
 *
 * @version 1.0.0
 * @date May 19, 2025
 */

import { processMetricForAlert } from '@/lib/performance/alert-service';
import { PERFORMANCE_BUDGETS } from '@/lib/performance/performance-budgets';

interface MetricData {
  name: string;
  value: number;
  page?: string;
  delta?: number;
  id: string;
}

interface EnhancedMetricData extends MetricData {
  timestamp: number;
  userAgent: string;
  ip: string;
  status?: 'good' | 'needs-improvement' | 'poor';
}

// Function to store performance metrics in database
async function storePerformanceData(_metricData: EnhancedMetricData): Promise<boolean> {
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

export async function POST(request: Request) {
  try {
    // Parse the metrics data from the request
    const metricsData = (await request.json()) as MetricData;

    // Add timestamp and user agent
    const enhancedData: EnhancedMetricData = {
      ...metricsData,
      timestamp: Date.now(),
      userAgent: request.headers.get('user-agent') || 'Unknown',
      ip: request.headers.get('x-forwarded-for')?.toString() || 'Unknown',
    };

    // Check metrics against thresholds and add status
    if (metricsData.name) {
      const budget = PERFORMANCE_BUDGETS.pageLoad[metricsData.name as keyof typeof PERFORMANCE_BUDGETS.pageLoad];
      if (budget) {
      enhancedData.status =
        metricsData.value <= budget.target ? 'good' :
        metricsData.value <= budget.acceptable ? 'needs-improvement' :
        'poor';
      }
    }

    // Store the enhanced data
    const stored = await storePerformanceData(enhancedData);
    if (!stored) {
      return new Response(
        JSON.stringify({ error: 'Failed to store performance data' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Process metric for alerting — call service with (category, name, value, additionalInfo)
    try {
      await processMetricForAlert(
        'performance',
        enhancedData.name || 'Unknown',
        enhancedData.value || 0,
        { status: enhancedData.status || 'unknown', page: enhancedData.page, timestamp: enhancedData.timestamp }
      );
    } catch (alertError) {
      console.error('[Performance API] Alert processing failed:', alertError);
    }

    return new Response(
      JSON.stringify({ success: true, data: enhancedData }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Performance API] Error processing metrics:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Only accept POST requests for this endpoint
export const runtime = 'edge';

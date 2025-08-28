import { NextResponse } from 'next/server';
import { getCitiesList } from '@/lib/data/city';

export async function GET() {
  const startTime = performance.now();
  try {
    const queryStartTime = performance.now();
    const cities = await getCitiesList(20);
    const queryEndTime = performance.now();
    const endTime = performance.now();

    return NextResponse.json({
      success: true,
      cities,
      metadata: {
        total: cities.length,
        query_time: new Date().toISOString(),
        performance: {
          totalTimeMs: (endTime - startTime).toFixed(2),
          queryTimeMs: (queryEndTime - queryStartTime).toFixed(2)
        }
      }
    });
  } catch (error) {
    const endTime = performance.now();
    console.error('[ERROR] Cities API:', error);
    return NextResponse.json({
      error: 'Failed to fetch cities',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false,
      cities: [],
      performance: {
        totalTimeMs: (endTime - startTime).toFixed(2)
      }
    }, { status: 500 });
  }
}

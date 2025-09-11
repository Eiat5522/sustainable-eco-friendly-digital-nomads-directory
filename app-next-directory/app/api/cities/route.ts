import { getCitiesList } from '@/lib/data/city';
import { NextResponse } from 'next/server';

// Static fallback dataset (module-scoped; initialized once)
const FALLBACK_CITIES = Object.freeze([
  {
    id: 'city-phuket',
    name: 'Phuket',
    slug: 'phuket',
    country: 'Thailand',
    highlights: [],
    imageUrl: null,
    imageDimensions: null,
    description: 'Preview city: Phuket (offline)',
  },
  {
    id: 'city-krabi',
    name: 'Krabi',
    slug: 'krabi-thailand',
    country: 'Thailand',
    highlights: [],
    imageUrl: null,
    imageDimensions: null,
    description: 'Preview city: Krabi (offline)',
  },
  {
    id: 'city-chiang-mai',
    name: 'Chiang Mai',
    slug: 'chiang-mai',
    country: 'Thailand',
    highlights: [],
    imageUrl: null,
    imageDimensions: null,
    description: 'Preview city: Chiang Mai (offline)',
  },
] as const);

export async function GET() {
  const startTime = performance.now();
  try {
    const queryStartTime = performance.now();
    const cities = await getCitiesList(20);
    const queryEndTime = performance.now();
    const endTime = performance.now();

    // Return top-level fields to match UI/tests expectations
    return NextResponse.json({
      cities,
      metadata: {
        total: cities.length,
        query_time: new Date().toISOString(),
        performance: {
          totalTimeMs: Number((endTime - startTime).toFixed(2)),
          queryTimeMs: Number((queryEndTime - queryStartTime).toFixed(2)),
        },
        source: 'primary',
      },
    });
  } catch (error) {
    const endTime = performance.now();
    console.error('[ERROR] Cities API:', error);

    // Use module-scoped FALLBACK_CITIES; keep 200 status for compatibility
    const list = typeof FALLBACK_CITIES !== 'undefined' ? FALLBACK_CITIES : fallbackCities;
    return NextResponse.json(
      {
        cities: list,
        metadata: {
          total: list.length,
          query_time: new Date().toISOString(),
          performance: {
            totalTimeMs: Number((endTime - startTime).toFixed(2)),
            queryTimeMs: 0,
          },
          source: 'fallback',
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'x-data-source': 'fallback',
        },
      }
    );
  }
}

import { getCitiesList } from '@/lib/data/city';
import { ApiResponseHandler } from '@/utils/api-response';

export async function GET() {
  const startTime = performance.now();
  try {
    const queryStartTime = performance.now();
    const cities = await getCitiesList(20);
    const queryEndTime = performance.now();
    const endTime = performance.now();

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

    return ApiResponseHandler.success({
      cities,
      metadata: {
        total: cities.length,
        query_time: new Date().toISOString(),
        performance: {
          totalTimeMs: Number((endTime - startTime).toFixed(2)),
          queryTimeMs: Number((queryEndTime - queryStartTime).toFixed(2))
        },
        source: 'primary'
      }
    });
  } catch (error) {
    const endTime = performance.now();
    console.error('[ERROR] Cities API:', error);

    // Uses module-scoped FALLBACK_CITIES (defined once) to avoid per-request allocation.

    return ApiResponseHandler.success({
      cities: typeof FALLBACK_CITIES !== 'undefined' ? FALLBACK_CITIES : fallbackCities,
      metadata: {
        total: (typeof FALLBACK_CITIES !== 'undefined' ? FALLBACK_CITIES : fallbackCities).length,
        query_time: new Date().toISOString(),
        performance: {
          totalTimeMs: Number((endTime - startTime).toFixed(2)),
          queryTimeMs: 0
        },
        source: 'fallback'
      }
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'x-data-source': 'fallback'
      }
    });
  }
}

import { NextRequest } from 'next/server';
import { ApiResponseHandler } from '@/utils/api-response';

// Eco tags data
const ECO_TAGS = [
  { id: 'zero-waste', label: 'Zero Waste', impact: 'high' },
  { id: 'renewable-energy', label: 'Renewable Energy', impact: 'high' },
  { id: 'plant-based', label: 'Plant-Based', impact: 'medium' },
  { id: 'eco-construction', label: 'Eco Construction', impact: 'high' },
  { id: 'water-conservation', label: 'Water Conservation', impact: 'medium' },
  { id: 'local-community', label: 'Local Community', impact: 'medium' },
  { id: 'organic', label: 'Organic', impact: 'medium' }
];

export async function GET(request: NextRequest) {
  try {
    const res = ApiResponseHandler.success({ tags: ECO_TAGS });
    res.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=600');
    return res;
  } catch (error) {
    console.error('Error fetching eco tags:', error);
    return ApiResponseHandler.error('Failed to fetch eco tags', 500, {
      code: 'ECO_TAGS_FETCH_FAILED',
    });
  }
}

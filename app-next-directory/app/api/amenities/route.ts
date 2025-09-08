import { client } from '@/lib/sanity/client';
import { groq } from 'next-sanity';
import { ApiResponseHandler } from '@/utils/api-response';

export async function GET() {
  try {
    const query = groq`*[_type == "amenity"]{ _id, name, description, badge{ asset->{ url } } }`;
    const amenities = await client.fetch(query);
    return ApiResponseHandler.success({ amenities });
  } catch (error) {
    console.error('Failed to fetch amenities:', error);
    return ApiResponseHandler.error('Failed to fetch amenities', 500);
  }
}

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
    const status = (error as any)?.status ?? (error as any)?.statusCode ?? 500;
    return ApiResponseHandler.error('Failed to fetch amenities', status);
  }
}

import { client } from '@/lib/sanity/client';
import { groq } from 'next-sanity';
import { ApiResponseHandler } from '@/utils/api-response';

export async function GET() {
  try {
    const categories: string[] = await client.fetch(
      groq`array::unique(*[_type == "listing" && defined(category)].category)`
    );
    return ApiResponseHandler.success({ categories });
  } catch (error) {
    console.error('Categories API error:', error);
    return ApiResponseHandler.error('Failed to fetch categories', 500);
  }
}

import { client } from '@/lib/sanity/client';
import { groq } from 'next-sanity';
import { ApiResponseHandler } from '@/utils/api-response';

export const runtime = 'nodejs';

type AmenityDTO = {
  _id: string;
  name: string;
  description?: string | null;
  badge?: { asset?: { url: string | null } } | null;
};

let schemaAmenitiesCache: AmenityDTO[] | null = null;

export async function GET() {
  try {
    const query = groq`*[_type == "amenity"]{ _id, name, description, badge{ asset->{ url } } }`;
    const amenities: AmenityDTO[] = await client.fetch(query);
    if (!Array.isArray(amenities) || amenities.length === 0) {
      const fallback = await getSchemaAmenitiesFallback();
      console.warn('Amenities CMS returned empty; using schema fallback (degraded)');
      return ApiResponseHandler.success({ amenities: fallback, degraded: true });
    }
    return ApiResponseHandler.success({ amenities });
  } catch (error) {
    console.error('Failed to fetch amenities:', error);
    const fallback = await getSchemaAmenitiesFallback();
    console.warn('Using schema amenities fallback due to CMS error (degraded)');
    return ApiResponseHandler.success({ amenities: fallback, degraded: true });
  }
}

// Build a simple amenity list from the schema fields as a fallback
async function getSchemaAmenitiesFallback(): Promise<AmenityDTO[]> {
  try {
    if (schemaAmenitiesCache) return schemaAmenitiesCache;
    const mod = await import('../../../../sanity/schemas/amenities.js');
    const schemaModule = (mod as { default?: unknown })?.default ?? mod;
    const fields = Array.isArray((schemaModule as { fields?: unknown })?.fields)
      ? ((schemaModule as { fields?: unknown }).fields as unknown[])
      : [];
    // Use boolean and string option field titles as amenity names
    const names: string[] = [];
    for (const field of fields) {
      if (!field || typeof field !== 'object') continue;
      const type = (field as { type?: unknown }).type;
      const title = (field as { title?: unknown }).title;
      if (typeof title !== 'string') continue;
      if (type === 'boolean' || type === 'string') {
        names.push(title);
      }
    }
    const unique = Array.from(new Set(names.filter(Boolean)));
    schemaAmenitiesCache = unique.map((n, idx) => ({ _id: `schema-amenity-${idx}`, name: n, badge: null }));
    return schemaAmenitiesCache;
  } catch {
    // Minimal hard fallback
    if (schemaAmenitiesCache) return schemaAmenitiesCache;
    const basics = ['Wi-Fi', 'Power Outlets', 'Air Conditioning', 'Parking', 'Showers', 'Lockers', 'Meeting Rooms'];
    schemaAmenitiesCache = basics.map((n, idx) => ({ _id: `basic-${idx}`, name: n, badge: null }));
    return schemaAmenitiesCache;
  }
}

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
      return ApiResponseHandler.success({ amenities: fallback });
    }
    return ApiResponseHandler.success({ amenities });
  } catch (error) {
    console.error('Failed to fetch amenities:', error);
    const status = (error as any)?.status ?? (error as any)?.statusCode ?? 500;
    // Fall back to schema-derived amenity names if CMS fails
    try {
      const fallback = await getSchemaAmenitiesFallback();
      return ApiResponseHandler.success({ amenities: fallback });
    } catch (e) {
      return ApiResponseHandler.error('Failed to fetch amenities', status);
    }
  }
}

// Build a simple amenity list from the schema fields as a fallback
async function getSchemaAmenitiesFallback(): Promise<AmenityDTO[]> {
  try {
    if (schemaAmenitiesCache) return schemaAmenitiesCache;
    const mod = await import('../../../../sanity/schemas/amenities.js');
    const schema: any = (mod as any).default || mod;
    const fields: any[] = Array.isArray(schema?.fields) ? schema.fields : [];
    // Use boolean and string option field titles as amenity names
    const names: string[] = [];
    for (const f of fields) {
      if (!f) continue;
      // boolean flags like Air Conditioning, Parking, etc.
      if (f.type === 'boolean' && typeof f.title === 'string') names.push(f.title);
      // string with options (e.g., Power Outlets, Seating) can be included as umbrella amenity
      if (f.type === 'string' && typeof f.title === 'string') names.push(f.title);
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

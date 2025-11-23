import { getAllCities } from '@/lib/sanity/queries';

export async function GET() {
  try {
    const cities = await getAllCities();
    return new Response(JSON.stringify(cities), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching cities in API route:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch cities' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

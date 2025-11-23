import { City, Listing } from '@/types';

// City details
export async function fetchCityDetails(slug: string): Promise<City> {
  try {
    const response = await fetch(`/api/cities/${slug}`);

    if (!response.ok) {
      throw new Error('Failed to fetch city details');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching city details:', error);
    throw error;
  }
}

// City listings
export async function fetchCityListings(slug: string): Promise<Listing[]> {
  try {
    const response = await fetch(`/api/listings?citySlug=${slug}`);

    if (!response.ok) {
      throw new Error('Failed to fetch city listings');
    }

    const data = await response.json();
    return data.data.listings || [];
  } catch (error) {
    console.error('Error fetching city listings:', error);
    return [];
  }
}

// More API functions can be added here

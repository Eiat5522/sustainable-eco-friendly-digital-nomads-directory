                    import type { CityDTO } from '@/types/dto'
import type { Listing } from '@/types';

// City details
export async function fetchCityDetails(slug: string): Promise<CityDTO> {
  try {
    // Allow route-level ISR to cache this request (300s) instead of bypassing it
    const response = await fetch(`/api/cities/${slug}`,
      { next: { revalidate: 300 } }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch city details');
    }

    const data = await response.json();
    // Support multiple API response shapes for compatibility:
    // - { data: <city> }
    // - { success: true, city: <city> }
    // - { city: <city> }
    // - { data: { city: <city> } }
    const city: unknown =
      data?.data?.city ??
      data?.city ??
      data?.data;    
    if (!city || typeof city !== 'object' || Array.isArray(city)) {
      throw new Error('City not found in API response');
    }

    return city as CityDTO;
  } catch (error) {
    console.error('Error fetching city details:', error);    throw error;
  }
}

// City listings
export async function fetchCityListings(slug: string): Promise<Listing[]> {
  try {
    // Allow route-level ISR to cache this request (300s) instead of bypassing it
    const response = await fetch(
      `/api/listings?citySlug=${slug}`,
      { next: { revalidate: 300 } }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch city listings');
    }

    const data = await response.json();
    // Handle shapes: { data: { listings } }, { success: true, listings }, { listings }
    const listings: Listing[] =
      Array.isArray(data?.data?.listings) ? data.data.listings :
      (data?.success === true && Array.isArray(data?.listings)) ? data.listings :
      (data?.success === undefined && Array.isArray(data?.listings)) ? data.listings :
      [];

    return listings;
  } catch (error) {
    console.error('Error fetching city listings:', error);
    return [];
  }
}

// More API functions can be added here

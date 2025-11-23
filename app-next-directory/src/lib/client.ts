// Search client implementation
import { Listing } from '@/types/listings';

export async function searchListings(query: string): Promise<Listing[]> {
  try {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error('Search request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

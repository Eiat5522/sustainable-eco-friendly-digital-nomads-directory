import { searchListings } from '@/lib/search';
import { SearchFilters, SortOption } from '@/types/search';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { query, filters, page = 1, limit = 12, sort }: {
      query?: string;
      filters?: SearchFilters;
      page?: number;
      limit?: number;
      sort?: SortOption;
    } = await request.json();

    const searchResults = await searchListings(query || '', filters, page, limit, sort);

    return NextResponse.json(searchResults);  } catch (error) {
    console.error('Search error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to perform search', details: errorMessage },
      { status: 500 }
    );
  }
}

import { getSearchSuggestions } from '@/lib/search';
import { NextResponse } from 'next/dist/server/web/spec-extension/response';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    const suggestions = await getSearchSuggestions(query);
    return NextResponse.json(suggestions);
  } catch (error: any) {
    console.error('Error fetching suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to get suggestions', details: error.message },
      { status: 500 }
    );
  }
}

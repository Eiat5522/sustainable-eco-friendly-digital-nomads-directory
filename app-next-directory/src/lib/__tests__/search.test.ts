import { searchListings, getSearchSuggestions, getSimilarListings } from '../search';
import type { SearchFilters, SortOption } from '@/types/search';

const fetchMock = jest.fn();

jest.mock('@/lib/sanity/client', () => ({
  client: {
    fetch: (...args: unknown[]) => fetchMock(...args),
  },
}));

describe('search utilities', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('builds advanced search queries with filters and pagination', async () => {
    const filters: SearchFilters = {
      category: 'cafe',
      city: 'Chiang Mai',
      ecoTags: ['Solar'],
      hasDigitalNomadFeatures: true,
      minSustainabilityScore: 70,
      maxPriceRange: 300,
    };
    const sort: SortOption = { field: 'relevance', direction: 'desc' };
    fetchMock
      .mockResolvedValueOnce([{ _id: 'listing-1', name: 'Eco Cafe' }])
      .mockResolvedValueOnce(25);

    const result = await searchListings('Eco', filters, 2, 5, sort);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [groqQuery, params] = fetchMock.mock.calls[0];
    expect(typeof groqQuery).toBe('string');
    expect(groqQuery).toContain('category == $category');
    expect(groqQuery).toContain('city->name == $city');
    expect(groqQuery).toContain('count((ecoFocusTags[]->name)[@ in $ecoTags]) > 0');
    expect(groqQuery).toContain('count(digitalNomadFeatures) > 0');
    expect(groqQuery).toContain('sustainabilityScore >= $minScore');
    expect(groqQuery).toContain('priceRange.max <= $maxPrice');
    expect(groqQuery).toContain('| order(_score desc)');
    expect(params).toMatchObject({
      searchText: 'Eco',
      category: 'cafe',
      city: 'Chiang Mai',
      ecoTags: ['Solar'],
      minScore: 70,
      maxPrice: 300,
    });
    expect(result.pagination).toEqual({ total: 25, page: 2, totalPages: 5, hasMore: true });
  });

  it('supports explicit field sorting when no search term is provided', async () => {
    const sort: SortOption = { field: 'rating', direction: 'asc' };
    fetchMock
      .mockResolvedValueOnce([{ _id: 'listing-2', name: 'Green Workspace' }])
      .mockResolvedValueOnce(10);

    const result = await searchListings('', undefined, 1, 10, sort);

    const [groqQuery] = fetchMock.mock.calls[0];
    expect(groqQuery).toContain('| order(rating asc)');
    expect(groqQuery).not.toContain('| order(name asc)');
    expect(result.pagination).toEqual({ total: 10, page: 1, totalPages: 1, hasMore: false });
  });

  it('returns unique suggestion strings', async () => {
    fetchMock.mockResolvedValueOnce([
      { name: 'Eco Space', keywords: ['Eco-Friendly Workspace', 'Remote'] },
      { name: 'Green Hub', keywords: ['Eco Trails', 'Remote'] },
    ]);

    const suggestions = await getSearchSuggestions('eco', 3);

    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), { query: 'eco' });
    expect(suggestions).toEqual(['Eco Space', 'Eco-Friendly Workspace', 'Eco Trails']);
  });

  it('fetches similar listings using weighted scoring', async () => {
    fetchMock.mockResolvedValueOnce([{ _id: 'listing-3', name: 'Nomad Nest' }]);

    const result = await getSimilarListings('listing-1', 2);

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('moderation.status == "published"'), {
      listingId: 'listing-1',
    });
    expect(result).toEqual([{ _id: 'listing-3', name: 'Nomad Nest' }]);
  });
});

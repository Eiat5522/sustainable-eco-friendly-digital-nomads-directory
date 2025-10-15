import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const fetchMock = jest.fn();

jest.mock('../sanity/client', () => ({
  client: { fetch: fetchMock },
}));

describe('search utilities', () => {
  beforeEach(() => {
    jest.resetModules();
    fetchMock.mockReset();
  });

  const setup = async () => {
    const mod = await import('../search');
    return { ...mod };
  };

  it('builds GROQ queries with filters and pagination metadata', async () => {
    const { searchListings } = await setup();

    fetchMock
      .mockResolvedValueOnce([{ _id: 'listing-1' }])
      .mockResolvedValueOnce(5);

    const result = await searchListings(
      'eco',
      { category: 'cafe', city: 'Lisbon', ecoTags: ['solar'], hasDigitalNomadFeatures: true },
      2,
      2,
      { field: 'relevance', direction: 'desc' },
    );

    const query = fetchMock.mock.calls[0][0] as string;
    expect(query).toContain('category == $category');
    expect(query).toContain('order(_score desc)');
    expect(fetchMock.mock.calls[0][1]).toEqual(expect.objectContaining({ searchText: 'eco', category: 'cafe' }));

    expect(result.results).toHaveLength(1);
    expect(result.pagination.total).toBe(5);
    expect(result.pagination.page).toBe(2);
    expect(result.pagination.totalPages).toBe(3);
  });

  it('returns unique suggestions derived from listings', async () => {
    const { getSearchSuggestions } = await setup();

    fetchMock.mockResolvedValueOnce([
      { name: 'Eco Hub', keywords: ['Eco Hub', 'Sustainable'] },
      { name: 'Green Space', keywords: ['green space', 'Eco Hub'] },
    ]);

    const suggestions = await getSearchSuggestions('eco');
    expect(fetchMock).toHaveBeenCalled();
    expect(suggestions).toEqual(['Eco Hub']);
  });

  it('fetches similar listings with the provided id', async () => {
    const { getSimilarListings } = await setup();

    fetchMock.mockResolvedValueOnce([{ _id: 'listing-2' }]);

    await getSimilarListings('listing-1');
    const query = fetchMock.mock.calls[0][0] as string;
    expect(query).toContain('$listingId');
    expect(fetchMock.mock.calls[0][1]).toEqual({ listingId: 'listing-1' });
  });
});

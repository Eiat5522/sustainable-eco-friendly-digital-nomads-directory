import { fetchCityDetails, fetchCityListings } from '../api';

describe('fetchCityDetails', () => {
  const mockCity = { _id: '1', name: 'Bangkok', slug: 'bangkok', listingCount: 10, country: 'Thailand' };

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns city data on success', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockCity }),
    });
    const result = await fetchCityDetails('bangkok');
    expect(result).toEqual(mockCity);
    expect(fetch).toHaveBeenCalledWith('/api/cities/bangkok');
  });

  it('throws error on non-ok response', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });
    await expect(fetchCityDetails('bangkok')).rejects.toThrow('Failed to fetch city details');
  });

  it('throws error on fetch failure', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
    await expect(fetchCityDetails('bangkok')).rejects.toThrow('Network error');
  });
});

describe('fetchCityListings', () => {
  const mockListings = [
    { _id: 'l1', name: 'Eco Space', slug: 'eco-space', description: '', type: 'coworking', priceRange: 'moderate', mainImage: { asset: { _ref: '', url: '' } }, city: { _id: '', name: '', slug: '', listingCount: 0, country: '' }, ecoTags: [], address: '', rating: 4.5, createdAt: '', updatedAt: '' },
  ];

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns listings array on success', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { listings: mockListings } }),
    });
    const result = await fetchCityListings('bangkok');
    expect(result).toEqual(mockListings);
    expect(fetch).toHaveBeenCalledWith('/api/listings?citySlug=bangkok');
  });

  it('returns empty array if listings missing', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: {} }),
    });
    const result = await fetchCityListings('bangkok');
    expect(result).toEqual([]);
  });

  it('returns empty array on non-ok response', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });
    await expect(fetchCityListings('bangkok')).resolves.toEqual([]);
  });

  it('returns empty array on fetch failure', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
    await expect(fetchCityListings('bangkok')).resolves.toEqual([]);
  });
});

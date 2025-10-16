import {
  getDigitalNomadVenueSummary,
  getDigitalNomadWorkspaces,
  getListingStats,
  getNearbyListings,
  searchListings,
} from '../index';

describe('query stubs', () => {
  it('returns venue summary data', async () => {
    const summary = await getDigitalNomadVenueSummary();
    expect(summary.coworkingSpaces.total).toBeGreaterThan(0);
    expect(summary.cafes.withGoodWifi).toBeGreaterThan(0);
  });

  it('returns workspace results respecting minimum wifi speed', async () => {
    const workspaces = await getDigitalNomadWorkspaces(50);
    expect(workspaces[0]).toMatchObject({ wifiSpeed: 100, hasWorkspaces: true });
  });

  it('returns listing stats snapshot', async () => {
    const stats = await getListingStats();
    expect(stats.totalListings).toBe(25);
    expect(stats.byCategory.some((entry) => entry.category === 'coworking')).toBe(true);
  });

  it('returns nearby listings using provided coordinates', async () => {
    const coords = { lat: 1, lng: 2 };
    const listings = await getNearbyListings(coords, 500);
    expect(listings[0]).toMatchObject({ distance: 500, location: { coordinates: coords } });
  });

  it('returns search results with image URLs', async () => {
    const results = await searchListings('eco');
    expect(results[0].primaryImage?.asset?.url).toContain('https://');
  });
});

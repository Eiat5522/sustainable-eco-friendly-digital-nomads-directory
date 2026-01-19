/**
 * Jest Test Suite for Featured Listings API Route
 */

import { jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { getFeaturedListings } from '@/lib/data-access/home.dal';
import { structuredLogger } from '@/lib/logger';
import { GET } from './route';

jest.mock('@/lib/data-access/home.dal', () => ({
  getFeaturedListings: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  structuredLogger: {
    error: jest.fn(),
  },
}));

describe('Featured Listings API - GET /api/featured-listings', () => {
  const mockedGetFeaturedListings = getFeaturedListings as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns featured listings from DAL with default limit', async () => {
    mockedGetFeaturedListings.mockResolvedValueOnce([
      {
        id: '1',
        name: 'Green Coworking Space',
        slug: 'green-coworking',
        imageUrl: '',
        city: 'BKK',
      },
    ]);

    const response = await GET(new NextRequest('http://localhost/api/featured-listings'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.listings).toHaveLength(1);
    expect(mockedGetFeaturedListings).toHaveBeenCalledWith(10);
  });

  it('uses limit query param when provided', async () => {
    mockedGetFeaturedListings.mockResolvedValueOnce([]);

    await GET(new NextRequest('http://localhost/api/featured-listings?limit=4'));

    expect(mockedGetFeaturedListings).toHaveBeenCalledWith(4);
  });

  it('falls back to default limit on invalid input', async () => {
    mockedGetFeaturedListings.mockResolvedValueOnce([]);

    await GET(new NextRequest('http://localhost/api/featured-listings?limit=not-a-number'));

    expect(mockedGetFeaturedListings).toHaveBeenCalledWith(10);
  });

  it('returns error response when DAL throws', async () => {
    mockedGetFeaturedListings.mockRejectedValueOnce(new Error('Sanity fetch error'));

    const response = await GET(new NextRequest('http://localhost/api/featured-listings'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(structuredLogger.error).toHaveBeenCalled();
  });
});

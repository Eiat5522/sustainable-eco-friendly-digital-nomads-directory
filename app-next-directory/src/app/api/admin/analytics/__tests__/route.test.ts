import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock the dependencies
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/sanity/client', () => ({
  client: {
    fetch: jest.fn(),
  },
}));

import { auth } from '@/lib/auth';
import { client } from '@/lib/sanity/client';

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockClient = client as { fetch: jest.MockedFunction<typeof client.fetch> };

describe('/api/admin/analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should require admin role', async () => {
    // Mock non-admin user
    mockAuth.mockResolvedValue({
      user: { role: 'user' },
    } as any);

    const request = new NextRequest('http://localhost:3000/api/admin/analytics');
    const response = await GET(request, { params: Promise.resolve({}) });
    const result = await response.json();

    expect(response.status).toBe(403);
    expect(result.error).toBe('Admin access required');
  });

  it('should return analytics data for admin user with optimized role counting', async () => {
    // Mock admin user
    mockAuth.mockResolvedValue({
      user: { role: 'admin' },
    } as any);

    // Mock the various count queries - this tests our optimization
    mockClient.fetch
      .mockResolvedValueOnce(100) // total users
      .mockResolvedValueOnce(50)  // total listings
      .mockResolvedValueOnce(25)  // total reviews
      .mockResolvedValueOnce(5)   // pending moderation
      .mockResolvedValueOnce(10)  // weekly signups
      .mockResolvedValueOnce([])  // moderation queue
      // Role count queries (our optimization)
      .mockResolvedValueOnce(2)   // admin count
      .mockResolvedValueOnce(80)  // user count (including undefined roles)
      .mockResolvedValueOnce(5)   // moderator count
      .mockResolvedValueOnce(3)   // editor count
      .mockResolvedValueOnce(8)   // venueOwner count
      .mockResolvedValueOnce(1)   // superAdmin count
      .mockResolvedValueOnce(1)   // contentEditor count
      .mockResolvedValueOnce(0);  // unidentifiedUser count

    const request = new NextRequest('http://localhost:3000/api/admin/analytics');
    const response = await GET(request, { params: Promise.resolve({}) });
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.analytics).toBeDefined();
    expect(result.analytics.overview).toEqual({
      totalUsers: 100,
      totalListings: 50,
      totalReviews: 25,
      weeklySignups: 10,
      pendingModeration: 5,
    });
    
    // Test our optimized role counting
    expect(result.analytics.userRoles).toEqual({
      admin: 2,
      user: 80,
      moderator: 5,
      editor: 3,
      venueOwner: 8,
      superAdmin: 1,
      contentEditor: 1,
      unidentifiedUser: 0,
    });

    // Verify that we made separate count queries instead of fetching all users
    expect(mockClient.fetch).toHaveBeenCalledWith('count(*[_type == "user" && role == "admin"])');
    expect(mockClient.fetch).toHaveBeenCalledWith('count(*[_type == "user" && (role == "user" || !defined(role))])');
    expect(mockClient.fetch).toHaveBeenCalledWith('count(*[_type == "user" && role == "moderator"])');
    // Should not have fetched all users with just role field
    expect(mockClient.fetch).not.toHaveBeenCalledWith(expect.stringContaining('*[_type == "user"] { role }'));
  });

  it('should handle errors gracefully', async () => {
    mockAuth.mockResolvedValue({
      user: { role: 'admin' },
    } as any);

    mockClient.fetch.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/admin/analytics');
    const response = await GET(request, { params: Promise.resolve({}) });
    const result = await response.json();

    expect(response.status).toBe(500);
    expect(result.error).toBe('Failed to fetch admin analytics');
  });
});
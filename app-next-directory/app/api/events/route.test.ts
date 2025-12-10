/**
 * Jest Test Suite for Events API Route
 * Tests covering:
 * 1. GET /api/events - Fetch upcoming events from Sanity
 * 2. Error handling for fetch failures
 * 3. Date filtering (only future events)
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const fetchMock = jest.fn();

// Mock the Sanity client used by the route to intercept .fetch calls
jest.mock('@/lib/sanity/client', () => ({
  client: { fetch: (...args: any[]) => fetchMock(...args) },
}));

let GET: any;

describe('Events API - GET /api/events', () => {
  beforeEach(() => {
    jest.resetModules();
    fetchMock.mockReset();
     
    GET = require('./route').GET;
  });

  afterEach(() => {
    // nothing to cleanup when using module mocks
  });

  describe('Successful Requests', () => {
    it('returns upcoming events ordered by start date', async () => {
      const mockEvents = [
        {
          _id: '1',
          title: 'Eco Summit 2024',
          slug: 'eco-summit-2024',
          startDate: '2024-12-01',
          endDate: '2024-12-03',
          location: 'Bangkok',
          ecoInitiatives: ['Carbon Neutral', 'Zero Waste'],
          imageUrl: 'https://example.com/image1.jpg',
          description: 'Annual eco summit',
        },
        {
          _id: '2',
          title: 'Digital Nomad Meetup',
          slug: 'nomad-meetup',
          startDate: '2024-12-15',
          endDate: '2024-12-15',
          location: 'Chiang Mai',
          ecoInitiatives: ['Local Food'],
          imageUrl: 'https://example.com/image2.jpg',
          description: 'Monthly meetup',
        },
      ];
      fetchMock.mockResolvedValueOnce(mockEvents);

      const request = new Request('http://localhost/api/events');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockEvents);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('returns an empty array when no upcoming events exist', async () => {
      fetchMock.mockResolvedValueOnce([]);

      const request = new Request('http://localhost/api/events');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });

    it('uses correct GROQ query with date filtering', async () => {
      fetchMock.mockResolvedValueOnce([]);

      const request = new Request('http://localhost/api/events');
      await GET(request);

      const query = fetchMock.mock.calls[0][0] as string;
      const params = fetchMock.mock.calls[0][1] as { now: string };

      expect(query).toContain('_type == "event"');
      expect(query).toContain('dateTime(startDate) >= dateTime($now)');
      expect(query).toContain('order(startDate asc)');
      expect(params).toHaveProperty('now');
      expect(typeof params.now).toBe('string');
    });

    it('includes all required event fields', async () => {
      fetchMock.mockResolvedValueOnce([]);

      const request = new Request('http://localhost/api/events');
      await GET(request);

      const query = fetchMock.mock.calls[0][0] as string;
      expect(query).toContain('_id');
      expect(query).toContain('title');
      expect(query).toContain('slug');
      expect(query).toContain('startDate');
      expect(query).toContain('endDate');
      expect(query).toContain('location');
      expect(query).toContain('ecoInitiatives');
      expect(query).toContain('imageUrl');
      expect(query).toContain('description');
    });
  });

  describe('Error Handling', () => {
    it('returns 500 on database fetch failure', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Sanity fetch error'));

      const request = new Request('http://localhost/api/events');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch events');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('handles network timeout errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network timeout'));

      const request = new Request('http://localhost/api/events');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch events');
    });
  });
});

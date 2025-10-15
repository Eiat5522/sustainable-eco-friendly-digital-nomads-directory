/**
 * Jest Test Suite for Events API Route
 * Tests covering:
 * 1. GET /api/events - Fetch upcoming events from Sanity
 * 2. Error handling for fetch failures
 * 3. Date filtering (only future events)
 */

import { jest } from '@jest/globals';
import { GET } from './route';
import { client } from '@/lib/sanity/client';

// Mock Sanity client
jest.mock('@/lib/sanity/client', () => ({
  client: {
    fetch: jest.fn(),
  },
}));

describe('Events API - GET /api/events', () => {
  let mockedFetch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedFetch = client.fetch as jest.Mock;
  });

  describe('Successful Requests', () => {
    it('should return upcoming events ordered by start date', async () => {
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
          description: 'Annual eco summit'
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
          description: 'Monthly meetup'
        }
      ];
      mockedFetch.mockResolvedValueOnce(mockEvents);

      const request = new Request('http://localhost/api/events');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockEvents);
      expect(data.data.length).toBe(2);
      expect(mockedFetch).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array when no upcoming events exist', async () => {
      mockedFetch.mockResolvedValueOnce([]);

      const request = new Request('http://localhost/api/events');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });

    it('should use correct GROQ query with date filtering', async () => {
      mockedFetch.mockResolvedValueOnce([]);

      const request = new Request('http://localhost/api/events');
      await GET(request);

      const query = mockedFetch.mock.calls[0][0];
      const params = mockedFetch.mock.calls[0][1];

      expect(query).toContain('_type == "event"');
      expect(query).toContain('dateTime(startDate) >= dateTime($now)');
      expect(query).toContain('order(startDate asc)');
      expect(params).toHaveProperty('now');
      expect(typeof params.now).toBe('string');
    });

    it('should include all required event fields', async () => {
      mockedFetch.mockResolvedValueOnce([]);

      const request = new Request('http://localhost/api/events');
      await GET(request);

      const query = mockedFetch.mock.calls[0][0];
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
    it('should return 500 on database fetch failure', async () => {
      mockedFetch.mockRejectedValueOnce(new Error('Sanity fetch error'));

      const request = new Request('http://localhost/api/events');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch events');
      expect(mockedFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle network timeout errors', async () => {
      mockedFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const request = new Request('http://localhost/api/events');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch events');
    });
  });
});

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock external dependencies used in the route
jest.mock('@/lib/sanity/client', () => ({
  client: {
    fetch: jest.fn(),
  },
}));

// Import after mocks to receive mocked versions
import { GET } from './route';
import { client } from '@/lib/sanity/client';

describe('API /api/events', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET', () => {
    it('returns 200 and event data on success', async () => {
      const mockEvents = [
        {
          _id: 'event1',
          title: 'Sustainable Tech Meetup',
          slug: 'sustainable-tech-meetup',
          startDate: '2024-06-01T10:00:00Z',
          endDate: '2024-06-01T12:00:00Z',
          location: 'Lisbon, Portugal',
          ecoInitiatives: ['carbon-neutral', 'zero-waste'],
          imageUrl: 'https://example.com/event1.jpg',
          description: 'A meetup for sustainable technology'
        }
      ];

      (client.fetch as jest.Mock).mockResolvedValueOnce(mockEvents);

      const req = new Request('http://localhost/api/events');
      const res = await GET(req);
      
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data).toEqual(mockEvents);
      expect(json.data.length).toBe(1);
      expect(json.data[0]).toHaveProperty('title');
      expect(json.data[0]).toHaveProperty('startDate');
      expect(json.data[0]).toHaveProperty('slug');
    });

    it('returns 200 and empty array when no events found', async () => {
      (client.fetch as jest.Mock).mockResolvedValueOnce([]);

      const req = new Request('http://localhost/api/events');
      const res = await GET(req);
      
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBe(0);
    });

    it('returns 500 when Sanity fetch throws an error', async () => {
      (client.fetch as jest.Mock).mockRejectedValueOnce(new Error('Sanity connection failed'));

      const req = new Request('http://localhost/api/events');
      const res = await GET(req);
      
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('Failed to fetch events');
    });

    it('calls Sanity with correct query and date parameter', async () => {
      (client.fetch as jest.Mock).mockResolvedValueOnce([]);

      const req = new Request('http://localhost/api/events');
      await GET(req);
      
      expect(client.fetch).toHaveBeenCalledWith(
        expect.stringContaining('*[_type == "event" && dateTime(startDate) >= dateTime($now)]'),
        expect.objectContaining({ now: expect.any(String) })
      );
    });

    it('ignores query parameters and processes request normally', async () => {
      (client.fetch as jest.Mock).mockResolvedValueOnce([]);

      const req = new Request('http://localhost/api/events?foo=bar&baz=qux');
      const res = await GET(req);
      
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      // The query parameters should be ignored and request should succeed
    });
  });
});
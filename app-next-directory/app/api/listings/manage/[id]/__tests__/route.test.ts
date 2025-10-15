/**
 * Test Suite for Manage Listings API Route
 * Tests covering:
 * 1. GET /api/listings/manage/[id] - Fetch listing for management
 * 2. PUT /api/listings/manage/[id] - Update listing
 * 3. DELETE /api/listings/manage/[id] - Delete listing
 * 4. Authentication and authorization
 * 5. Error handling
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextResponse } from 'next/server';

// Mock the auth function
const mockAuth = jest.fn();
jest.mock('@/lib/auth', () => ({
  __esModule: true,
  auth: mockAuth,
}));

// Mock the Sanity client
const mockFetch = jest.fn();
const mockPatch = jest.fn();
const mockSet = jest.fn();
const mockCommit = jest.fn();
const mockDelete = jest.fn();

jest.mock('@/lib/sanity', () => ({
  __esModule: true,
  client: {
    fetch: mockFetch,
    patch: jest.fn(() => ({
      set: mockSet,
    })),
    delete: mockDelete,
  },
}));

let GET: typeof import('../route').GET;
let PUT: typeof import('../route').PUT;
let DELETE: typeof import('../route').DELETE;

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>;
};

describe('Manage Listings API', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockSet.mockReturnValue({ commit: mockCommit });
    
    // Dynamically import the route handler
    const module = await import('../route');
    GET = module.GET;
    PUT = module.PUT;
    DELETE = module.DELETE;
  });

  describe('GET /api/listings/manage/[id]', () => {
    describe('Successful Requests', () => {
      it('should return listing when user is venue owner', async () => {
        const mockListing = {
          _id: 'listing-1',
          title: 'Eco Workspace',
          owner: { _ref: 'user-1' },
        };

        mockAuth.mockResolvedValueOnce({
          user: { id: 'user-1', role: 'venueOwner' },
        });
        mockFetch.mockResolvedValueOnce(mockListing);

        const request = new Request('http://localhost/api/listings/manage/listing-1');
        const context: RouteContext = { params: { id: 'listing-1' } };

        const response = await GET(request, context);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual(mockListing);
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('*[_type == "listing"'),
          { id: 'listing-1', userId: 'user-1' }
        );
      });

      it('should handle async params', async () => {
        const mockListing = { _id: 'listing-1', title: 'Test' };
        mockAuth.mockResolvedValueOnce({
          user: { id: 'user-1', role: 'venueOwner' },
        });
        mockFetch.mockResolvedValueOnce(mockListing);

        const request = new Request('http://localhost/api/listings/manage/listing-1');
        const context: RouteContext = { params: Promise.resolve({ id: 'listing-1' }) };

        const response = await GET(request, context);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual(mockListing);
      });
    });

    describe('Authorization', () => {
      it('should return 401 when user is not authenticated', async () => {
        mockAuth.mockResolvedValueOnce(null);

        const request = new Request('http://localhost/api/listings/manage/listing-1');
        const context: RouteContext = { params: { id: 'listing-1' } };

        const response = await GET(request, context);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
        expect(mockFetch).not.toHaveBeenCalled();
      });

      it('should return 401 when user role is not venueOwner', async () => {
        mockAuth.mockResolvedValueOnce({
          user: { id: 'user-1', role: 'user' },
        });

        const request = new Request('http://localhost/api/listings/manage/listing-1');
        const context: RouteContext = { params: { id: 'listing-1' } };

        const response = await GET(request, context);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });

      it('should return 401 when user id is missing', async () => {
        mockAuth.mockResolvedValueOnce({
          user: { role: 'venueOwner' },
        });

        const request = new Request('http://localhost/api/listings/manage/listing-1');
        const context: RouteContext = { params: { id: 'listing-1' } };

        const response = await GET(request, context);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });
    });

    describe('Error Handling', () => {
      it('should return 404 when listing not found', async () => {
        mockAuth.mockResolvedValueOnce({
          user: { id: 'user-1', role: 'venueOwner' },
        });
        mockFetch.mockResolvedValueOnce(null);

        const request = new Request('http://localhost/api/listings/manage/listing-1');
        const context: RouteContext = { params: { id: 'listing-1' } };

        const response = await GET(request, context);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Listing not found');
      });

      it('should return 500 when fetch fails', async () => {
        mockAuth.mockResolvedValueOnce({
          user: { id: 'user-1', role: 'venueOwner' },
        });
        mockFetch.mockRejectedValueOnce(new Error('Sanity error'));

        const request = new Request('http://localhost/api/listings/manage/listing-1');
        const context: RouteContext = { params: { id: 'listing-1' } };

        const response = await GET(request, context);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch listing');
      });
    });
  });

  describe('PUT /api/listings/manage/[id]', () => {
    describe('Successful Requests', () => {
      it('should update listing when user is owner', async () => {
        const existingListing = {
          _id: 'listing-1',
          title: 'Old Title',
          owner: { _ref: 'user-1' },
        };
        const updatedListing = {
          _id: 'listing-1',
          title: 'New Title',
          owner: { _ref: 'user-1' },
        };

        mockAuth.mockResolvedValueOnce({
          user: { id: 'user-1', role: 'venueOwner' },
        });
        mockFetch.mockResolvedValueOnce(existingListing);
        mockCommit.mockResolvedValueOnce(updatedListing);

        const request = new Request('http://localhost/api/listings/manage/listing-1', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ title: 'New Title' }),
        });
        const context: RouteContext = { params: { id: 'listing-1' } };

        const response = await PUT(request, context);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual(updatedListing);
        expect(mockCommit).toHaveBeenCalled();
      });

      it('should update listing with city reference', async () => {
        const existingListing = {
          _id: 'listing-1',
          title: 'Test',
          owner: { _ref: 'user-1' },
        };

        mockAuth.mockResolvedValueOnce({
          user: { id: 'user-1', role: 'venueOwner' },
        });
        mockFetch.mockResolvedValueOnce(existingListing);
        mockCommit.mockResolvedValueOnce({ ...existingListing, city: { _ref: 'city-1' } });

        const request = new Request('http://localhost/api/listings/manage/listing-1', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ city: 'city-1' }),
        });
        const context: RouteContext = { params: { id: 'listing-1' } };

        const response = await PUT(request, context);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(mockCommit).toHaveBeenCalled();
      });

      it('should update listing with array references', async () => {
        const existingListing = {
          _id: 'listing-1',
          owner: { _ref: 'user-1' },
        };

        mockAuth.mockResolvedValueOnce({
          user: { id: 'user-1', role: 'venueOwner' },
        });
        mockFetch.mockResolvedValueOnce(existingListing);
        mockCommit.mockResolvedValueOnce(existingListing);

        const request = new Request('http://localhost/api/listings/manage/listing-1', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            ecoFocusTags: ['tag-1', 'tag-2'],
            digitalNomadFeatures: ['feature-1'],
            amenities: ['amenity-1', 'amenity-2'],
          }),
        });
        const context: RouteContext = { params: { id: 'listing-1' } };

        const response = await PUT(request, context);

        expect(response.status).toBe(200);
        expect(mockCommit).toHaveBeenCalled();
      });
    });

    describe('Authorization', () => {
      it('should return 401 when user is not authenticated', async () => {
        mockAuth.mockResolvedValueOnce(null);

        const request = new Request('http://localhost/api/listings/manage/listing-1', {
          method: 'PUT',
          body: JSON.stringify({ title: 'New Title' }),
        });
        const context: RouteContext = { params: { id: 'listing-1' } };

        const response = await PUT(request, context);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });
    });

    describe('Error Handling', () => {
      it('should return 404 when listing not found', async () => {
        mockAuth.mockResolvedValueOnce({
          user: { id: 'user-1', role: 'venueOwner' },
        });
        mockFetch.mockResolvedValueOnce(null);

        const request = new Request('http://localhost/api/listings/manage/listing-1', {
          method: 'PUT',
          body: JSON.stringify({ title: 'New Title' }),
        });
        const context: RouteContext = { params: { id: 'listing-1' } };

        const response = await PUT(request, context);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Listing not found');
      });

      it('should return 400 for invalid city reference', async () => {
        const existingListing = {
          _id: 'listing-1',
          owner: { _ref: 'user-1' },
        };

        mockAuth.mockResolvedValueOnce({
          user: { id: 'user-1', role: 'venueOwner' },
        });
        mockFetch.mockResolvedValueOnce(existingListing);

        const request = new Request('http://localhost/api/listings/manage/listing-1', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ city: 123 }),
        });
        const context: RouteContext = { params: { id: 'listing-1' } };

        const response = await PUT(request, context);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid city reference');
      });

      it('should return 500 when update fails', async () => {
        const existingListing = {
          _id: 'listing-1',
          owner: { _ref: 'user-1' },
        };

        mockAuth.mockResolvedValueOnce({
          user: { id: 'user-1', role: 'venueOwner' },
        });
        mockFetch.mockResolvedValueOnce(existingListing);
        mockCommit.mockRejectedValueOnce(new Error('Update failed'));

        const request = new Request('http://localhost/api/listings/manage/listing-1', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ title: 'New Title' }),
        });
        const context: RouteContext = { params: { id: 'listing-1' } };

        const response = await PUT(request, context);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to update listing');
      });
    });
  });

  describe('DELETE /api/listings/manage/[id]', () => {
    describe('Successful Requests', () => {
      it('should delete listing when user is owner', async () => {
        const existingListing = {
          _id: 'listing-1',
          title: 'To Delete',
          owner: { _ref: 'user-1' },
        };

        mockAuth.mockResolvedValueOnce({
          user: { id: 'user-1', role: 'venueOwner' },
        });
        mockFetch.mockResolvedValueOnce(existingListing);
        mockDelete.mockResolvedValueOnce(undefined);

        const request = new Request('http://localhost/api/listings/manage/listing-1', {
          method: 'DELETE',
        });
        const context: RouteContext = { params: { id: 'listing-1' } };

        const response = await DELETE(request, context);

        expect(response.status).toBe(204);
        expect(mockDelete).toHaveBeenCalledWith('listing-1');
      });

      it('should handle async params', async () => {
        const existingListing = {
          _id: 'listing-1',
          owner: { _ref: 'user-1' },
        };

        mockAuth.mockResolvedValueOnce({
          user: { id: 'user-1', role: 'venueOwner' },
        });
        mockFetch.mockResolvedValueOnce(existingListing);
        mockDelete.mockResolvedValueOnce(undefined);

        const request = new Request('http://localhost/api/listings/manage/listing-1', {
          method: 'DELETE',
        });
        const context: RouteContext = { params: Promise.resolve({ id: 'listing-1' }) };

        const response = await DELETE(request, context);

        expect(response.status).toBe(204);
      });
    });

    describe('Authorization', () => {
      it('should return 401 when user is not authenticated', async () => {
        mockAuth.mockResolvedValueOnce(null);

        const request = new Request('http://localhost/api/listings/manage/listing-1', {
          method: 'DELETE',
        });
        const context: RouteContext = { params: { id: 'listing-1' } };

        const response = await DELETE(request, context);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
        expect(mockDelete).not.toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      it('should return 404 when listing not found', async () => {
        mockAuth.mockResolvedValueOnce({
          user: { id: 'user-1', role: 'venueOwner' },
        });
        mockFetch.mockResolvedValueOnce(null);

        const request = new Request('http://localhost/api/listings/manage/listing-1', {
          method: 'DELETE',
        });
        const context: RouteContext = { params: { id: 'listing-1' } };

        const response = await DELETE(request, context);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Listing not found');
        expect(mockDelete).not.toHaveBeenCalled();
      });

      it('should return 500 when delete fails', async () => {
        const existingListing = {
          _id: 'listing-1',
          owner: { _ref: 'user-1' },
        };

        mockAuth.mockResolvedValueOnce({
          user: { id: 'user-1', role: 'venueOwner' },
        });
        mockFetch.mockResolvedValueOnce(existingListing);
        mockDelete.mockRejectedValueOnce(new Error('Delete failed'));

        const request = new Request('http://localhost/api/listings/manage/listing-1', {
          method: 'DELETE',
        });
        const context: RouteContext = { params: { id: 'listing-1' } };

        const response = await DELETE(request, context);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to delete listing');
      });
    });
  });
});

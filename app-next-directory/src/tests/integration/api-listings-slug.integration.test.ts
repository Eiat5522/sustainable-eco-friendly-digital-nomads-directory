import { describe, expect, it, jest } from '@jest/globals';
import { ApiResponseHandler } from '@/utils/api-response';
import { createSlugHandlers } from '../../../app/api/listings/[slug]/route';

type ListingRecord = {
  title: string;
  slug: string;
  category: string;
  description: string;
  location: string;
  ecoTags: string[];
  digitalNomadFeatures: string[];
  priceRange?: string;
  website?: string;
  contactPhone?: string;
  contactEmail?: string;
  ownerId?: string | null;
  updatedAt?: Date;
};

describe('API /api/listings/[slug] integration', () => {
  const setupHandlers = (initialRecords: ListingRecord[] = []) => {
    const records = [...initialRecords];

    const collection = {
      findOne: jest.fn(
        async (query: { slug: string }) =>
          records.find(record => record.slug === query.slug) ?? null
      ),
      updateOne: jest.fn(async (filter: { slug: string }, update: { $set: Partial<ListingRecord> }) => {
        const index = records.findIndex(r => r.slug === filter.slug);
        if (index === -1) return { matchedCount: 0, modifiedCount: 0 };
        
        records[index] = {
          ...records[index],
          ...update.$set,
        };
        return { matchedCount: 1, modifiedCount: 1 };
      }),
    };

    const requireAuth = jest.fn().mockResolvedValue({ user: { id: 'user-123' } });
    const handleAuthError = jest.fn().mockImplementation((error: unknown) => 
      ApiResponseHandler.error('auth error', 401, String(error))
    );
    const getCollection = jest.fn(async () => collection);

    const handlers = createSlugHandlers({
      requireAuth,
      handleAuthError,
      getCollection,
    });

    return { handlers, records, collection, requireAuth };
  };

  it('updates allowed fields and ignores disallowed fields like ownerId', async () => {
    const initialListing: ListingRecord = {
      title: 'Original Title',
      slug: 'test-slug',
      category: 'coworking',
      description: 'Original description',
      location: 'Original location',
      ecoTags: [],
      digitalNomadFeatures: [],
      ownerId: 'user-123'
    };

    const { handlers, records, collection } = setupHandlers([initialListing]);
    
    const payload = {
      title: 'Updated Title',
      description: 'Updated description',
      ownerId: 'hacker-id', // Should be ignored
      slug: 'new-slug', // Should be ignored
      unknownField: 'some-value' // Should be ignored
    };

    const request = new Request('http://localhost/api/listings/test-slug', {
      method: 'PUT',
      body: JSON.stringify(payload),
      headers: { 'content-type': 'application/json' },
    });

    const response = await handlers.PUT(request, { params: Promise.resolve({ slug: 'test-slug' }) });
    expect(response.status).toBe(200);

    const updatedRecord = records[0];
    expect(updatedRecord.title).toBe('Updated Title');
    expect(updatedRecord.description).toBe('Updated description');
    expect(updatedRecord.ownerId).toBe('user-123'); // Remained unchanged
    expect(updatedRecord.slug).toBe('test-slug'); // Remained unchanged
    
    // Verify updateOne was called with only allowed fields
    const updateCall = (collection.updateOne as jest.Mock).mock.calls[0][1] as { $set: Record<string, any> };
    expect(updateCall.$set).toHaveProperty('title', 'Updated Title');
    expect(updateCall.$set).toHaveProperty('description', 'Updated description');
    expect(updateCall.$set).not.toHaveProperty('ownerId');
    expect(updateCall.$set).not.toHaveProperty('slug');
    expect(updateCall.$set).not.toHaveProperty('unknownField');
  });

  it('returns 403 if user is not the owner', async () => {
    const initialListing: ListingRecord = {
      title: 'Original Title',
      slug: 'test-slug',
      category: 'coworking',
      description: 'Original description',
      location: 'Original location',
      ecoTags: [],
      digitalNomadFeatures: [],
      ownerId: 'other-user'
    };

    const { handlers } = setupHandlers([initialListing]);
    
    const request = new Request('http://localhost/api/listings/test-slug', {
      method: 'PUT',
      body: JSON.stringify({ title: 'New Title' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await handlers.PUT(request, { params: Promise.resolve({ slug: 'test-slug' }) });
    expect(response.status).toBe(403);
  });

  it('returns 404 if listing does not exist', async () => {
    const { handlers } = setupHandlers([]);
    
    const request = new Request('http://localhost/api/listings/non-existent', {
      method: 'PUT',
      body: JSON.stringify({ title: 'New Title' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await handlers.PUT(request, { params: Promise.resolve({ slug: 'non-existent' }) });
    expect(response.status).toBe(404);
  });
});
    expect(updateCall.$set).toHaveProperty('updatedAt');
  });

  it('returns 404 if listing not found', async () => {
    const { handlers } = setupHandlers([]);
    
    const request = new Request('http://localhost/api/listings/non-existent', {
      method: 'PUT',
      body: JSON.stringify({ title: 'New Title' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await handlers.PUT(request, { params: Promise.resolve({ slug: 'non-existent' }) });
    expect(response.status).toBe(404);
  });

  it('returns 403 if user is not the owner', async () => {
    const initialListing: ListingRecord = {
      title: 'Original Title',
      slug: 'test-slug',
      category: 'coworking',
      description: 'Original description',
      location: 'Original location',
      ecoTags: [],
      digitalNomadFeatures: [],
      ownerId: 'other-user'
    };

    const { handlers } = setupHandlers([initialListing]);
    
    const request = new Request('http://localhost/api/listings/test-slug', {
      method: 'PUT',
      body: JSON.stringify({ title: 'New Title' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await handlers.PUT(request, { params: Promise.resolve({ slug: 'test-slug' }) });
    expect(response.status).toBe(403);
  });
});

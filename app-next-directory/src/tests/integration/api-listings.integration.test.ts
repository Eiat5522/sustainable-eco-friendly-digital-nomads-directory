import { describe, expect, it, jest } from '@jest/globals';
import { ApiResponseHandler } from '@/utils/api-response';
import { createListingsHandlers } from '../../../app/api/listings/route';

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
  createdAt?: Date;
};

const parseResponse = async (response: Response) => ({
  status: response.status,
  body: await response.json(),
});

const createRequest = (payload: unknown) =>
  new Request('http://localhost/api/listings', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'content-type': 'application/json' },
  });

describe('API /api/listings integration', () => {
  const setupHandlers = () => {
    const records: ListingRecord[] = [];

    const collection = {
      find: jest.fn(() => {
        let skipValue = 0;
        let limitValue = records.length;
        return {
          skip(value: number) {
            skipValue = Math.max(0, value);
            return this;
          },
          limit(value: number) {
            limitValue = Math.max(0, value);
            return this;
          },
          async toArray() {
            const end = limitValue === 0 ? records.length : skipValue + limitValue;
            return records.slice(skipValue, end).map(record => ({ ...record }));
          },
        };
      }),
      findOne: jest.fn(
        async (query: { slug: string }) =>
          records.find(record => record.slug === query.slug) ?? null
      ),
      insertOne: jest.fn(async (document: ListingRecord) => {
        const stored: ListingRecord = {
          ...document,
          createdAt: document.createdAt ?? new Date(),
        };
        records.push(stored);
        return { insertedId: `${document.slug}-${records.length}` };
      }),
      countDocuments: jest.fn(async () => records.length),
    };

    const requireAuth = jest.fn().mockResolvedValue({ user: { id: 'user-123', plan: 'premium' } });
    const handleAuthError = jest
      .fn()
      .mockImplementation((error: unknown) =>
        ApiResponseHandler.error(
          'auth error',
          401,
          error instanceof Error ? error.message : String(error ?? '')
        )
      );
    const getCollection = jest.fn(async () => collection);

    const handlers = createListingsHandlers({
      requireAuth,
      handleAuthError,
      getCollection,
    });

    return { handlers, records, collection, requireAuth, getCollection };
  };

  it('persists newly created listings and exposes them through GET', async () => {
    const { handlers, records, collection } = setupHandlers();
    const payload = {
      title: 'Zero Waste Hub',
      slug: 'zero-waste-hub',
      category: 'coworking',
      description: 'A bright, plant-filled space for eco nomads.',
      location: 'Lisbon, Portugal',
      ecoTags: ['solar'],
      digitalNomadFeatures: ['fast-wifi'],
      priceRange: 'moderate',
      website: 'https://example.com',
    };

    const postResponse = await handlers.POST(createRequest(payload));
    const post = await parseResponse(postResponse);

    expect(post.status).toBe(200);
    expect(post.body).toEqual({
      success: true,
      data: expect.objectContaining({
        ...payload,
        id: expect.any(String),
        ownerId: 'user-123',
      }),
      message: 'Listing created successfully',
    });
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      ...payload,
      ownerId: 'user-123',
    });

    const getResponse = await handlers.GET({
      url: 'http://localhost/api/listings?page=1&limit=5',
    });
    const fetched = await parseResponse(getResponse);

    expect(fetched.status).toBe(200);
    expect(fetched.body.success).toBe(true);
    expect(fetched.body.data).toEqual({
      listings: [
        expect.objectContaining({
          title: 'Zero Waste Hub',
          slug: 'zero-waste-hub',
          ownerId: 'user-123',
        }),
      ],
      pagination: {
        page: 1,
        limit: 5,
        total: 1,
        totalPages: 1,
      },
    });
    expect(collection.countDocuments).toHaveBeenCalledTimes(1);
  });

  it('prevents duplicate listings with the same slug across POST requests', async () => {
    const { handlers } = setupHandlers();
    const payload = {
      title: 'Ocean Breeze Retreat',
      slug: 'ocean-breeze-retreat',
      category: 'accommodation',
      description: 'Eco-minded retreat with ocean views.',
      location: 'Koh Lanta, Thailand',
      ecoTags: ['rainwater-collection'],
      digitalNomadFeatures: ['quiet-zones'],
    };

    const first = await parseResponse(await handlers.POST(createRequest(payload)));
    expect(first.status).toBe(200);
    expect(first.body.success).toBe(true);

    const second = await parseResponse(await handlers.POST(createRequest(payload)));
    expect(second.status).toBe(409);
    expect(second.body).toEqual({
      success: false,
      error: 'Listing with this slug already exists',
    });
  });
});

/**
 * MSW Handlers for Sanity CMS API
 *
 * Intercepts HTTP requests to Sanity API endpoints:
 * - GET  https://{projectId}.api.sanity.io/v{apiVersion}/data/query/{dataset} - GROQ queries
 * - POST https://{projectId}.api.sanity.io/v{apiVersion}/data/mutate/{dataset} - Mutations
 * - GET  https://{projectId}.api.sanity.io/v{apiVersion}/data/doc/{dataset}/{docId} - Get document
 *
 * @module mocks/handlers/sanity
 */

import { HttpResponse, http } from 'msw';
import { createTestData } from '@/tests/helpers/test-data';
import type { Listing } from '@/types/listings';

const data = createTestData();

// In-memory document store for mutations
const documentStore = new Map<string, unknown>();

/**
 * Sanity CMS API handlers
 */
export const sanityHandlers = [
  /**
   * GET - Sanity GROQ query endpoint
   * Handles queries like: *[_type == "listing"][0...10]
   */
  http.get(
    'https://:projectId.api.sanity.io/v:apiVersion/data/query/:dataset',
    ({ request, params }) => {
      const url = new URL(request.url);
      const query = url.searchParams.get('query') || '';
      // params available but not currently used
      void params;

      // Handle nomadFeature queries
      if (query.includes('_type == "nomadFeature"')) {
        const mockFeatures = [
          { _id: 'feature-1', name: 'Co-working Space', _type: 'nomadFeature' },
          { _id: 'feature-2', name: 'High-Speed Internet', _type: 'nomadFeature' },
          { _id: 'feature-3', name: 'Meeting Rooms', _type: 'nomadFeature' },
          { _id: 'feature-4', name: 'Quiet Work Areas', _type: 'nomadFeature' },
        ];

        return HttpResponse.json({
          ms: 10,
          query,
          result: mockFeatures,
        });
      }

      // Handle listing queries
      if (query.includes('_type == "listing"')) {
        // Check if it's a count query
        if (query.includes('count(')) {
          return HttpResponse.json({
            ms: 10,
            query,
            result: data.listings.length,
          });
        }

        // Return listing results
        const results = data.listings.map((listing: Listing) => ({
          _id: listing._id,
          name: listing.name,
          slug: { current: listing.slug?.current },
          category: listing.category || listing.type,
          city: {
            _id:
              (listing.city as { _id?: string; name: string; slug?: { current?: string } })._id ||
              `city-${listing.city.slug?.current}`,
            name: listing.city.name,
            slug: { current: listing.city.slug?.current },
            country:
              (listing.city as { country?: string; name: string; slug?: { current?: string } })
                .country || 'Thailand',
          },
          priceRange: listing.priceRange || 'medium',
          moderation: { status: 'published' },
          shortDescription: listing.shortDescription,
          longDescription: listing.longDescription,
          ecoFeatures: listing.ecoFocusTags?.map(tag => tag.name) || [],
          amenityNames: listing.digitalNomadFeatures || [],
        }));

        return HttpResponse.json({
          ms: 15,
          query,
          result: results,
        });
      }

      // Handle review queries
      if (query.includes('_type == "review"')) {
        return HttpResponse.json({
          ms: 10,
          query,
          result: data.reviews || [],
        });
      }

      // Handle city queries
      if (query.includes('_type == "city"')) {
        return HttpResponse.json({
          ms: 10,
          query,
          result: data.cities || [],
        });
      }

      // Default: return empty result
      return HttpResponse.json({
        ms: 5,
        query,
        result: [],
      });
    }
  ),

  /**
   * GET - Get single document by ID
   * Handles: /v{apiVersion}/data/doc/{dataset}/{docId}
   */
  http.get(
    'https://:projectId.api.sanity.io/v:apiVersion/data/doc/:dataset/:docId',
    ({ params }) => {
      const { docId } = params as { docId: string };

      // Check in-memory store first
      if (documentStore.has(docId)) {
        return HttpResponse.json({
          documents: [documentStore.get(docId)],
        });
      }

      // Check test data
      const listing = data.listings.find((l: Listing) => l._id === docId);
      if (listing) {
        return HttpResponse.json({
          documents: [listing],
        });
      }

      const review = data.reviews?.find((r) => r._id === docId);
      if (review) {
        return HttpResponse.json({
          documents: [review],
        });
      }

      // Document not found
      return HttpResponse.json(
        {
          error: 'Document not found',
        },
        { status: 404 }
      );
    }
  ),

  /**
   * POST - Sanity mutations endpoint
   * Handles create, update, delete operations
   */
  http.post(
    'https://:projectId.api.sanity.io/v:apiVersion/data/mutate/:dataset',
    async ({ request }) => {
      let body: { mutations?: Array<{ create?: unknown; patch?: unknown; delete?: unknown }> } = {};
      try {
        body = (await request.json()) as typeof body;
      } catch {
        return HttpResponse.json(
          {
            error: 'Invalid JSON',
          },
          { status: 400 }
        );
      }

      const mutations = body.mutations || [];
      const results: unknown[] = [];

      for (const mutation of mutations) {
        // Handle create mutation
        if (mutation.create) {
          const doc = mutation.create as { _id?: string; _type?: string };
          const id = doc._id || `generated-${Date.now()}`;
          const newDoc = { ...doc, _id: id, _createdAt: new Date().toISOString() };
          documentStore.set(id, newDoc);
          results.push(newDoc);
        }

        // Handle patch mutation
        if (mutation.patch) {
          const patch = mutation.patch as { id: string; set?: unknown };
          const existingDoc = documentStore.get(patch.id) || {};
          const updatedDoc = {
            ...existingDoc,
            ...(patch.set || {}),
            _updatedAt: new Date().toISOString(),
          };
          documentStore.set(patch.id, updatedDoc);
          results.push(updatedDoc);
        }

        // Handle delete mutation
        if (mutation.delete) {
          const deleteOp = mutation.delete as { id: string };
          documentStore.delete(deleteOp.id);
          results.push({ _id: deleteOp.id });
        }
      }

      return HttpResponse.json({
        transactionId: `mock-transaction-${Date.now()}`,
        results,
      });
    }
  ),
];

export default sanityHandlers;

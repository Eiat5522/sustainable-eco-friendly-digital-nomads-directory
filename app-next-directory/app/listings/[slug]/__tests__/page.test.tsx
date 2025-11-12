import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeAll, afterAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockClientFetch = jest.fn();
const mockTransformToDetailDTO = jest.fn();
const mockAuth = jest.fn();
const mockNotFound = jest.fn(() => {
  throw new Error('NOT_FOUND_TRIGGERED');
});
const renderListingDetailView = jest.fn();

jest.mock('@/lib/sanity/client', () => ({
  client: { fetch: mockClientFetch },
}));

jest.mock('@/lib/dto-transformer', () => ({
  transformToDetailDTO: mockTransformToDetailDTO,
}));

jest.mock('@/lib/auth', () => ({
  auth: mockAuth,
}));

jest.mock('next/navigation', () => ({
  notFound: mockNotFound,
}));

jest.mock('@/components/listings/ListingDetailView', () => ({
  ListingDetailView: (props: unknown) => {
    renderListingDetailView(props);
    return <div data-testid="listing-detail-view" />;
  },
}));

jest.mock('@/components/layout/Header', () => ({
  Header: () => <div data-testid="mock-header" />,
}));

jest.mock('@/components/layout/Footer', () => ({
  Footer: () => <div data-testid="mock-footer" />,
}));

const originalFetch = global.fetch;
const originalStructuredClone = global.structuredClone;

const structuredClonePolyfill = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

beforeAll(() => {
  if (typeof global.structuredClone !== 'function') {
    (global as any).structuredClone = structuredClonePolyfill as typeof structuredClone;
  }
});

describe('app/listings/[slug]/page', () => {
  beforeEach(() => {
    jest.resetModules();
    mockClientFetch.mockReset();
    mockTransformToDetailDTO.mockReset();
    mockAuth.mockReset();
    renderListingDetailView.mockReset();
    mockNotFound.mockClear();
    global.fetch = jest.fn() as unknown as typeof fetch;
    if (typeof global.structuredClone !== 'function') {
      (global as any).structuredClone = structuredClonePolyfill as typeof structuredClone;
    }
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_E2E = '0';
    process.env.E2E = '0';
  });

  afterAll(() => {
    global.fetch = originalFetch;
    if (originalStructuredClone) {
      (global as any).structuredClone = originalStructuredClone;
    } else {
      delete (global as any).structuredClone;
    }
  });

  async function importPageModule() {
    let imported: typeof import('../page') | undefined;
    await jest.isolateModulesAsync(async () => {
      imported = await import('../page');
    });
    return imported as typeof import('../page');
  }

  it('uses fixture data when E2E flag is enabled', async () => {
    process.env.NEXT_PUBLIC_E2E = '1';
    const pageModule = await importPageModule();

    const element = await pageModule.default({ params: Promise.resolve({ slug: 'banyan-tree-phuket' }) });
    render(element);

    expect(screen.getByTestId('listing-detail-view')).toBeInTheDocument();
    expect(renderListingDetailView).toHaveBeenCalledTimes(1);
    expect(renderListingDetailView.mock.calls[0][0]).toMatchObject({
      listing: expect.objectContaining({ name: 'Banyan Tree Phuket' }),
      isSignedIn: true,
      isFavorited: false,
    });
    expect(mockNotFound).not.toHaveBeenCalled();
  });

  it('invokes notFound for missing E2E fixture', async () => {
    process.env.NEXT_PUBLIC_E2E = '1';
    const pageModule = await importPageModule();

    await expect(
      pageModule.default({ params: Promise.resolve({ slug: 'unknown-fixture' }) })
    ).rejects.toThrow('NOT_FOUND_TRIGGERED');
    expect(mockNotFound).toHaveBeenCalled();
  });

  it('invokes notFound when listing is not found', async () => {
    const pageModule = await importPageModule();
    mockClientFetch.mockResolvedValue(null);

    await expect(
      pageModule.default({ params: Promise.resolve({ slug: 'not-a-real-slug' }) })
    ).rejects.toThrow('NOT_FOUND_TRIGGERED');

    expect(mockClientFetch).toHaveBeenCalled();
    expect(mockNotFound).toHaveBeenCalled();
  });

  it('fetches listing data and renders detail view for standard requests', async () => {
    const pageModule = await importPageModule();
    const listing = {
      id: 'listing-123',
      name: 'Eco Retreat',
      city: { id: 'city-1', name: 'Chiang Mai', slug: 'chiang-mai' },
      galleryImages: ['/hero.jpg'],
    };

    mockClientFetch.mockImplementation((query: unknown) => {
      if (typeof query === 'string' && query.includes('moderation.status == "published"')) {
        return Promise.resolve({ _id: 'listing-raw' });
      }
      if (typeof query === 'string' && query.includes('city._ref == $cityId')) {
        return Promise.resolve([
          {
            _id: 'rel-1',
            name: 'Forest Escape',
            slug: 'forest-escape',
            priceRange: 'premium',
            imageUrl: 'https://cdn.test/forest.jpg',
            ecoFocusTags: ['Solar', { name: 'Zero waste' }],
            city: { name: 'Chiang Mai', country: 'Thailand', slug: 'chiang-mai' },
          },
        ]);
      }
      if (typeof query === 'string' && query.includes('userFavorite')) {
        return Promise.resolve({ _id: 'favorite-1' });
      }
      return Promise.resolve(null);
    });

    mockTransformToDetailDTO.mockReturnValue(listing);
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'member' } });

    (global.fetch as unknown as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        reviews: [
          {
            id: 'review-1',
            rating: 5,
            comment: 'Amazing stay',
            createdAt: '2024-03-01T00:00:00.000Z',
            user: { name: 'Alice', image: 'https://cdn.test/alice.jpg', id: 'user-42' },
          },
        ],
      }),
    });

    const element = await pageModule.default({ params: Promise.resolve({ slug: 'eco-retreat' }) });
    render(element);

    expect(mockTransformToDetailDTO).toHaveBeenCalledWith({ _id: 'listing-raw' });
    expect(global.fetch as jest.Mock).toHaveBeenCalledWith(
      expect.stringContaining('listingId=listing-123&userId=user-1'),
      expect.objectContaining({ next: { tags: [`listing:${listing.id}-reviews`] } })
    );
    expect(renderListingDetailView).toHaveBeenCalledWith(
      expect.objectContaining({
        listing,
        isSignedIn: true,
        isFavorited: true,
        reviews: [
          expect.objectContaining({
            id: 'review-1',
            rating: 5,
            status: 'approved',
          }),
        ],
      })
    );
  });

  it('handles transform errors by logging and calling notFound', async () => {
    mockClientFetch.mockResolvedValueOnce({ _id: 'broken' });
    mockTransformToDetailDTO.mockImplementationOnce(() => {
      throw new Error('bad transform');
    });

    const pageModule = await importPageModule();

    await expect(
      pageModule.default({ params: Promise.resolve({ slug: 'broken-listing' }) })
    ).rejects.toThrow('NOT_FOUND_TRIGGERED');

    // structuredLogger.error is called, but we don't verify the exact call here
    expect(mockNotFound).toHaveBeenCalled();
  });

  it('returns graceful metadata when listing is missing', async () => {
    mockClientFetch.mockResolvedValueOnce(null);

    const pageModule = await importPageModule();
    const metadata = await pageModule.generateMetadata({ params: Promise.resolve({ slug: 'missing' }) });

    expect(metadata).toEqual({ title: 'Listing not found' });
  });

  it('builds metadata from listing details', async () => {
    mockClientFetch.mockResolvedValueOnce({ _id: 'listing-raw' });
    mockTransformToDetailDTO.mockReturnValue({
      id: 'listing-321',
      name: 'Ocean Escape',
      shortDescription: 'A breezy coastal stay',
      longDescription: 'Extensive description of the coastal stay experience.',
      galleryImages: ['https://cdn.test/ocean.jpg'],
    });

    const pageModule = await importPageModule();
    const metadata = await pageModule.generateMetadata({ params: Promise.resolve({ slug: 'ocean-escape' }) });

    expect(metadata).toEqual({
      title: 'Ocean Escape',
      description: 'A breezy coastal stay',
      openGraph: {
        title: 'Ocean Escape',
        description: 'A breezy coastal stay',
        images: ['https://cdn.test/ocean.jpg'],
      },
    });
  });

  it('recovers from related listing and review errors gracefully', async () => {
    const pageModule = await importPageModule();

    mockClientFetch
      .mockResolvedValueOnce({ _id: 'listing-raw' })
      .mockRejectedValueOnce(new Error('related failed'))
      .mockResolvedValueOnce(null);

    mockTransformToDetailDTO.mockReturnValue({
      id: 'listing-999',
      name: 'Mountain Base',
      city: { id: 'city-1' },
      galleryImages: [],
    });
    mockAuth.mockResolvedValue({ user: { id: 'user-7', role: 'venueOwner' } });

    (global.fetch as unknown as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'boom' }),
    });

    const element = await pageModule.default({ params: Promise.resolve({ slug: 'mountain-base' }) });
    render(element);

    expect(renderListingDetailView).toHaveBeenCalledWith(
      expect.objectContaining({
        relatedListings: [],
        reviews: [],
        isFavorited: false,
      })
    );
  });
});

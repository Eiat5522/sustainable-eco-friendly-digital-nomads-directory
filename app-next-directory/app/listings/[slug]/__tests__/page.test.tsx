import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';

const mockAuth = jest.fn();
const mockNotFound = jest.fn(() => {
  throw new Error('NOT_FOUND_TRIGGERED');
});
const renderListingDetailView = jest.fn();
const mockGetListingBySlug = jest.fn();
const mockGetRelatedListings = jest.fn();
const mockGetPopularListingSlugs = jest.fn();
const mockGetListingReviews = jest.fn();

jest.mock('@/lib/auth', () => ({
  auth: mockAuth,
}));

jest.mock('@/lib/data-access/listings.dal', () => ({
  getListingBySlug: (...args: unknown[]) => mockGetListingBySlug(...args),
  getRelatedListings: (...args: unknown[]) => mockGetRelatedListings(...args),
  getPopularListingSlugs: (...args: unknown[]) => mockGetPopularListingSlugs(...args),
}));

jest.mock('@/lib/data-access/favorites.dal', () => ({
  getListingReviews: (...args: unknown[]) => mockGetListingReviews(...args),
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
    mockAuth.mockReset();
    mockGetListingBySlug.mockReset();
    mockGetRelatedListings.mockReset();
    mockGetPopularListingSlugs.mockReset();
    mockGetListingReviews.mockReset();
    renderListingDetailView.mockReset();
    mockNotFound.mockClear();
    if (typeof global.structuredClone !== 'function') {
      (global as any).structuredClone = structuredClonePolyfill as typeof structuredClone;
    }
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_E2E = '0';
    process.env.E2E = '0';
  });

  afterAll(() => {
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

  it('generates static params from popular listing slugs', async () => {
    const popularSlugs = [{ slug: 'eco-stay' }, { slug: 'forest-lodge' }];
    mockGetPopularListingSlugs.mockResolvedValue(popularSlugs);

    const pageModule = await importPageModule();
    const params = await pageModule.generateStaticParams();

    expect(mockGetPopularListingSlugs).toHaveBeenCalledTimes(1);
    expect(mockGetPopularListingSlugs).toHaveBeenCalledWith();
    await expect(mockGetPopularListingSlugs.mock.results[0]?.value).resolves.toEqual(popularSlugs);
    expect(params).toEqual(popularSlugs);
  });

  it('uses fixture data when E2E flag is enabled', async () => {
    process.env.NEXT_PUBLIC_E2E = '1';
    const pageModule = await importPageModule();

    const element = await pageModule.default({
      params: Promise.resolve({ slug: 'banyan-tree-phuket' }),
    });
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
    mockGetListingBySlug.mockResolvedValue(null);

    await expect(
      pageModule.default({ params: Promise.resolve({ slug: 'not-a-real-slug' }) })
    ).rejects.toThrow('NOT_FOUND_TRIGGERED');

    expect(mockGetListingBySlug).toHaveBeenCalledWith('not-a-real-slug');
    expect(mockNotFound).toHaveBeenCalled();
  });

  it('fetches listing data and renders detail view for standard requests', async () => {
    const pageModule = await importPageModule();
    const listing = {
      id: 'listing-123',
      name: 'Eco Retreat',
      slug: 'eco-retreat',
      city: { id: 'city-1', name: 'Chiang Mai', slug: 'chiang-mai' },
      galleryImages: ['/hero.jpg'],
    };
    const relatedListings = [
      {
        id: 'rel-1',
        name: 'Forest Escape',
        slug: 'forest-escape',
        priceRange: 'premium',
        imageUrl: 'https://cdn.test/forest.jpg',
        ecoFocusTags: ['Solar', 'Zero waste'],
        city: { id: 'city-1', name: 'Chiang Mai', country: 'Thailand', slug: 'chiang-mai' },
      },
    ];
    const reviews = [
      {
        id: 'review-1',
        rating: 5,
        comment: 'Amazing stay',
        createdAt: '2024-03-01T00:00:00.000Z',
        status: 'approved',
        user: { name: 'Alice', image: 'https://cdn.test/alice.jpg', id: 'user-42' },
      },
    ];

    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'member' } });
    mockGetListingBySlug.mockResolvedValue(listing);
    mockGetRelatedListings.mockResolvedValue(relatedListings);
    mockGetListingReviews.mockResolvedValue(reviews);

    const element = await pageModule.default({ params: Promise.resolve({ slug: 'eco-retreat' }) });
    render(element);

    expect(mockGetListingBySlug).toHaveBeenCalledWith('eco-retreat');
    expect(mockGetRelatedListings).toHaveBeenCalledWith('city-1', 'listing-123');
    expect(mockGetListingReviews).toHaveBeenCalledWith('eco-retreat', 'user-1');
    expect(renderListingDetailView).toHaveBeenCalledWith(
      expect.objectContaining({
        listing,
        isSignedIn: true,
        isFavorited: false,
        userId: 'user-1',
        relatedListings,
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

  it('renders a signed-out view when no session is available', async () => {
    const pageModule = await importPageModule();
    const listing = {
      id: 'listing-404',
      name: 'Quiet Lodge',
      slug: 'quiet-lodge',
      city: { id: 'city-9', name: 'Reykjavik', slug: 'reykjavik' },
      galleryImages: ['/hero.jpg'],
    };

    mockAuth.mockResolvedValue(null);
    mockGetListingBySlug.mockResolvedValue(listing);
    mockGetRelatedListings.mockResolvedValue([]);
    mockGetListingReviews.mockResolvedValue([]);

    const element = await pageModule.default({ params: Promise.resolve({ slug: 'quiet-lodge' }) });
    render(element);

    expect(renderListingDetailView).toHaveBeenCalledWith(
      expect.objectContaining({
        listing,
        isSignedIn: false,
        isFavorited: false,
        userId: undefined,
      })
    );
  });

  it('returns graceful metadata when listing is missing', async () => {
    mockGetListingBySlug.mockResolvedValueOnce(null);

    const pageModule = await importPageModule();
    const metadata = await pageModule.generateMetadata({
      params: Promise.resolve({ slug: 'missing' }),
    });

    expect(metadata).toEqual({ title: 'Listing not found' });
  });

  it('builds metadata from listing details', async () => {
    mockGetListingBySlug.mockResolvedValueOnce({
      id: 'listing-321',
      name: 'Ocean Escape',
      shortDescription: 'A breezy coastal stay',
      longDescription: 'Extensive description of the coastal stay experience.',
      galleryImages: ['https://cdn.test/ocean.jpg'],
    });

    const pageModule = await importPageModule();
    const metadata = await pageModule.generateMetadata({
      params: Promise.resolve({ slug: 'ocean-escape' }),
    });

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

    const listing = {
      id: 'listing-999',
      name: 'Mountain Base',
      city: { id: 'city-1' },
      galleryImages: [],
      slug: 'mountain-base',
    };
    mockAuth.mockResolvedValue({ user: { id: 'user-7', role: 'venueOwner' } });
    mockGetListingBySlug.mockResolvedValue(listing);
    mockGetRelatedListings.mockResolvedValue([]);
    mockGetListingReviews.mockResolvedValue([]);

    const element = await pageModule.default({
      params: Promise.resolve({ slug: 'mountain-base' }),
    });
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

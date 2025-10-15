import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';

const notFoundMock = jest.fn(() => {
  const error = new Error('NEXT_NOT_FOUND') as Error & { digest?: string };
  error.digest = 'NEXT_NOT_FOUND';
  throw error;
});

jest.mock('next/navigation', () => ({
  notFound: notFoundMock,
}));

const listingDetailViewSpy = jest.fn((props: any) => (
  <div data-testid="listing-detail-view">
    <span data-testid="listing-name">{props.listing?.name}</span>
    <span data-testid="related-count">{props.relatedListings?.length ?? 0}</span>
    <span data-testid="reviews-count">{props.reviews?.length ?? 0}</span>
    <span data-testid="is-signed-in">{String(props.isSignedIn)}</span>
    <span data-testid="is-favorited">{String(props.isFavorited)}</span>
    <span data-testid="user-id">{props.userId ?? ''}</span>
  </div>
));

jest.mock('@/components/listings/ListingDetailView', () => ({
  ListingDetailView: (props: unknown) => listingDetailViewSpy(props),
}));

jest.mock('@/components/layout/Header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

jest.mock('@/components/layout/Footer', () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}));

jest.mock('@/lib/dto-transformer', () => ({
  transformToDetailDTO: jest.fn(),
}));

jest.mock('@/lib/sanity/client', () => ({
  client: { fetch: jest.fn() },
}));

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

const originalFetch = global.fetch;
const originalStructuredClone = global.structuredClone;
const originalE2E = process.env.NEXT_PUBLIC_E2E;
const originalE2EFlag = process.env.E2E;

beforeAll(() => {
  if (typeof global.structuredClone !== 'function') {
    (global as any).structuredClone = (value: unknown) => JSON.parse(JSON.stringify(value));
  }
});

afterEach(() => {
  global.fetch = originalFetch;
  process.env.NEXT_PUBLIC_E2E = originalE2E;
  process.env.E2E = originalE2EFlag;
  jest.clearAllMocks();
});

afterAll(() => {
  if (originalStructuredClone) {
    (global as any).structuredClone = originalStructuredClone;
  } else {
    delete (global as any).structuredClone;
  }
});

describe('ListingPage', () => {
  it('renders E2E fixture when slug matches and E2E mode is enabled', async () => {
    process.env.NEXT_PUBLIC_E2E = '1';
    process.env.E2E = '0';
    jest.resetModules();

    const { default: ListingPage } = await import('../listings/[slug]/page');

    const element = await ListingPage({ params: Promise.resolve({ slug: 'banyan-tree-phuket' }) });
    render(element);

    expect(screen.getByTestId('listing-detail-view')).toBeInTheDocument();
    const props = listingDetailViewSpy.mock.calls.at(-1)?.[0] ?? {};
    expect(props.listing?.name).toBe('Banyan Tree Phuket');
    expect(props.isSignedIn).toBe(true);
    expect(props.isFavorited).toBe(false);
  });

  it('calls notFound when E2E fixture does not exist', async () => {
    process.env.NEXT_PUBLIC_E2E = '1';
    process.env.E2E = '0';
    jest.resetModules();

    const { default: ListingPage } = await import('../listings/[slug]/page');

    await expect(
      ListingPage({ params: Promise.resolve({ slug: 'missing-slug' }) })
    ).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it('renders listing data with related listings, reviews, and favorite status', async () => {
    process.env.NEXT_PUBLIC_E2E = '0';
    process.env.E2E = '0';
    jest.resetModules();

    const [{ default: ListingPage }, clientModule, transformerModule, authModule] = await Promise.all([
      import('../listings/[slug]/page'),
      import('@/lib/sanity/client'),
      import('@/lib/dto-transformer'),
      import('@/lib/auth'),
    ]);

    const listingRaw = { _id: 'raw-listing' };
    const listingDto = {
      id: 'listing-1',
      name: 'Eco Stay Retreat',
      shortDescription: 'Eco stay short',
      longDescription: 'Eco stay long',
      imageUrl: null,
      galleryImages: [],
      city: { id: 'city-1', name: 'Green City', slug: 'green-city', country: 'Wonderland' },
    };

    const sanityFetch = clientModule.client.fetch as jest.Mock;
    const transformToDetailDTO = transformerModule.transformToDetailDTO as jest.Mock;
    const auth = authModule.auth as jest.Mock;

    sanityFetch.mockResolvedValueOnce(listingRaw);
    sanityFetch.mockResolvedValueOnce([
      {
        _id: 'related-1',
        name: 'Related Spot',
        slug: 'related-spot',
        priceRange: 'premium',
        imageUrl: '/image.jpg',
        city: { id: 'city-2', name: 'Blue City', slug: 'blue-city', country: 'Wonderland' },
        ecoFocusTags: [{ name: 'Solar Powered' }],
      },
    ]);
    sanityFetch.mockResolvedValueOnce({ _id: 'favorite-1' });

    transformToDetailDTO.mockReturnValue(listingDto);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        reviews: [
          {
            id: 'review-1',
            rating: 4,
            comment: 'Great stay',
            createdAt: '2024-01-01T00:00:00.000Z',
            user: { name: 'Avery', image: '/avatar.png', id: 'user-2' },
            status: 'approved',
          },
        ],
      }),
    } as Response);

    auth.mockResolvedValue({ user: { id: 'user-1', role: 'user' } });

    const element = await ListingPage({ params: Promise.resolve({ slug: 'eco-stay-retreat' }) });
    render(element);

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByTestId('listing-detail-view')).toBeInTheDocument();

    const props = listingDetailViewSpy.mock.calls.at(-1)?.[0] ?? {};
    expect(props.listing).toEqual(listingDto);
    expect(props.reviews ?? []).toHaveLength(1);
    expect(props.isSignedIn).toBe(true);
    expect(typeof props.isFavorited).toBe('boolean');
    expect(props.userId).toBe('user-1');
    expect(sanityFetch.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('handles downstream fetch failures by returning safe defaults', async () => {
    process.env.NEXT_PUBLIC_E2E = '0';
    process.env.E2E = '0';
    jest.resetModules();

    const [{ default: ListingPage }, clientModule, transformerModule, authModule] = await Promise.all([
      import('../listings/[slug]/page'),
      import('@/lib/sanity/client'),
      import('@/lib/dto-transformer'),
      import('@/lib/auth'),
    ]);

    const listingRaw = { _id: 'raw-listing' };
    const listingDto = {
      id: 'listing-2',
      name: 'Fallback Lodge',
      shortDescription: 'Fallback short',
      longDescription: 'Fallback long',
      imageUrl: null,
      galleryImages: [],
      city: { id: 'city-9', name: 'Fallback City', slug: 'fallback-city', country: 'Unknown' },
    };

    const sanityFetch = clientModule.client.fetch as jest.Mock;
    const transformToDetailDTO = transformerModule.transformToDetailDTO as jest.Mock;
    const auth = authModule.auth as jest.Mock;

    sanityFetch.mockResolvedValueOnce(listingRaw);
    sanityFetch.mockRejectedValueOnce(new Error('related failure'));
    sanityFetch.mockRejectedValueOnce(new Error('favorite failure'));

    transformToDetailDTO.mockReturnValue(listingDto);

    global.fetch = jest.fn().mockRejectedValue(new Error('reviews failure'));

    auth.mockResolvedValue({ user: { id: 'user-5', role: 'user' } });

    const element = await ListingPage({ params: Promise.resolve({ slug: 'fallback-lodge' }) });
    render(element);

    const props = listingDetailViewSpy.mock.calls.at(-1)?.[0] ?? {};
    expect(props.relatedListings ?? []).toEqual([]);
    expect(props.reviews ?? []).toEqual([]);
    expect(props.isFavorited).toBe(false);
  });

  it('throws notFound when listing is missing', async () => {
    process.env.NEXT_PUBLIC_E2E = '0';
    process.env.E2E = '0';
    jest.resetModules();

    const [{ default: ListingPage }, clientModule, transformerModule] = await Promise.all([
      import('../listings/[slug]/page'),
      import('@/lib/sanity/client'),
      import('@/lib/dto-transformer'),
    ]);

    const sanityFetch = clientModule.client.fetch as jest.Mock;
    const transformToDetailDTO = transformerModule.transformToDetailDTO as jest.Mock;

    sanityFetch.mockResolvedValueOnce(null);
    transformToDetailDTO.mockReset();

    await expect(
      ListingPage({ params: Promise.resolve({ slug: 'missing-listing' }) })
    ).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it('generates metadata for a listing', async () => {
    process.env.NEXT_PUBLIC_E2E = '0';
    process.env.E2E = '0';
    jest.resetModules();

    const [pageModule, clientModule, transformerModule] = await Promise.all([
      import('../listings/[slug]/page'),
      import('@/lib/sanity/client'),
      import('@/lib/dto-transformer'),
    ]);

    const sanityFetch = clientModule.client.fetch as jest.Mock;
    const transformToDetailDTO = transformerModule.transformToDetailDTO as jest.Mock;

    sanityFetch.mockResolvedValueOnce({ _id: 'raw-listing' });
    transformToDetailDTO.mockReturnValue({
      id: 'listing-meta',
      name: 'Meta Listing',
      shortDescription: 'A great place to stay',
      longDescription: 'Long description about the listing',
      imageUrl: '/primary.jpg',
      galleryImages: ['/primary.jpg'],
      city: null,
    });

    const metadata = await pageModule.generateMetadata({
      params: Promise.resolve({ slug: 'meta-listing' }),
    } as any);

    expect(metadata).toEqual(
      expect.objectContaining({
        title: 'Meta Listing',
        description: 'A great place to stay',
        openGraph: expect.objectContaining({
          images: ['/primary.jpg'],
        }),
      })
    );
  });

  it('returns fallback metadata when listing transformation fails', async () => {
    process.env.NEXT_PUBLIC_E2E = '0';
    process.env.E2E = '0';
    jest.resetModules();

    const [pageModule, clientModule, transformerModule] = await Promise.all([
      import('../listings/[slug]/page'),
      import('@/lib/sanity/client'),
      import('@/lib/dto-transformer'),
    ]);

    const sanityFetch = clientModule.client.fetch as jest.Mock;
    const transformToDetailDTO = transformerModule.transformToDetailDTO as jest.Mock;

    sanityFetch.mockResolvedValueOnce({ _id: 'raw-listing' });
    transformToDetailDTO.mockImplementation(() => {
      throw new Error('transform failure');
    });

    const metadata = await pageModule.generateMetadata({
      params: Promise.resolve({ slug: 'broken-listing' }),
    } as any);

    expect(metadata).toEqual({ title: 'Listing not found' });
  });
});

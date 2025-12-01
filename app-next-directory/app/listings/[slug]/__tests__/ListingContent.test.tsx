import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import ListingContent from '../ListingContent';

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

jest.mock('@/lib/dto-transformer', () => ({
  transformToDetailDTO: jest.fn(),
}));

jest.mock('@/lib/sanity/client', () => ({
  client: jest.fn(() => ({ fetch: jest.fn() })),
}));

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/utils/db-helpers', () => ({
  getCollection: jest.fn(),
}));

const originalFetch = global.fetch;
const originalE2E = process.env.NEXT_PUBLIC_E2E;
const originalE2EFlag = process.env.E2E;

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  global.fetch = originalFetch;
  process.env.NEXT_PUBLIC_E2E = originalE2E;
  process.env.E2E = originalE2EFlag;
});

describe('ListingContent (server component)', () => {
  it('renders listing details with related listings and reviews', async () => {
    const [clientModule, transformerModule, authModule, dbHelpersModule] = await Promise.all([
      import('@/lib/sanity/client'),
      import('@/lib/dto-transformer'),
      import('@/lib/auth'),
      import('@/utils/db-helpers'),
    ]);

    const listingRaw = { _id: 'raw-listing' };
    const listingDto = {
      id: 'listing-1',
      name: 'Eco Stay Retreat',
      slug: 'eco-stay-retreat',
      shortDescription: 'Eco stay short',
      longDescription: 'Eco stay long',
      imageUrl: null,
      galleryImages: [],
      city: { id: 'city-1', name: 'Green City', slug: 'green-city', country: 'Wonderland' },
    };

    const sanityFetch = clientModule.client.fetch as jest.Mock;
    const transformToDetailDTO = transformerModule.transformToDetailDTO as jest.Mock;
    const auth = authModule.auth as jest.Mock;
    const getCollection = dbHelpersModule.getCollection as jest.Mock;

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

    // Mock MongoDB collection for reviews
    const mockCollection = {
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([
        {
          id: 'review-1',
          rating: 4,
          comment: 'Great stay',
          createdAt: '2024-01-01T00:00:00.000Z',
          user: { name: 'Avery', image: '/avatar.png', id: 'user-2' },
          status: 'approved',
        },
      ]),
    };
    getCollection.mockResolvedValue(mockCollection);

    auth.mockResolvedValue({ user: { id: 'user-1', role: 'user' } });

    const element = await ListingContent({ slug: 'eco-stay-retreat', userId: 'user-1' });
    render(element);

    expect(screen.getByTestId('listing-detail-view')).toBeInTheDocument();
    const props = listingDetailViewSpy.mock.calls.at(-1)?.[0] ?? {};
    expect(props.listing).toEqual(listingDto);
    expect(props.reviews ?? []).toHaveLength(1);
    expect(props.relatedListings ?? []).toHaveLength(1);
    expect(props.isSignedIn).toBe(true);
    expect(props.isFavorited).toBe(true);
    expect(props.userId).toBe('user-1');
  });

  it('handles downstream failures by returning safe defaults', async () => {
    const [clientModule, transformerModule, authModule] = await Promise.all([
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

    const element = await ListingContent({ slug: 'fallback-lodge', userId: 'user-5' });
    render(element);

    const props = listingDetailViewSpy.mock.calls.at(-1)?.[0] ?? {};
    expect(props.relatedListings ?? []).toEqual([]);
    expect(props.reviews ?? []).toEqual([]);
    expect(props.isFavorited).toBe(false);
  });

  it('calls notFound when listing is missing', async () => {
    const [clientModule, transformerModule] = await Promise.all([
      import('@/lib/sanity/client'),
      import('@/lib/dto-transformer'),
    ]);

    const sanityFetch = clientModule.client.fetch as jest.Mock;
    const transformToDetailDTO = transformerModule.transformToDetailDTO as jest.Mock;

    sanityFetch.mockResolvedValueOnce(null);
    transformToDetailDTO.mockReset();

    await expect(ListingContent({ slug: 'missing-listing' })).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});

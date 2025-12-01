import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

const notFoundMock = jest.fn(() => {
  const error = new Error('NEXT_NOT_FOUND') as Error & { digest?: string };
  error.digest = 'NEXT_NOT_FOUND';
  throw error;
});

jest.mock('next/navigation', () => ({
  notFound: notFoundMock,
}));

const listingContentMock = jest.fn(({ slug }: { slug: string }) => (
  <div data-testid="listing-content-stub">listing:{slug}</div>
));

jest.mock('../listings/[slug]/ListingContent', () => ({
  __esModule: true,
  default: (props: { slug: string }) => listingContentMock(props),
}));

const originalE2E = process.env.NEXT_PUBLIC_E2E;
const originalE2EFlag = process.env.E2E;

afterEach(() => {
  process.env.NEXT_PUBLIC_E2E = originalE2E;
  process.env.E2E = originalE2EFlag;
  jest.clearAllMocks();
});

describe('ListingPage (wiring)', () => {
  it('renders the ListingContent stub for E2E fixtures', async () => {
    process.env.NEXT_PUBLIC_E2E = '1';
    process.env.E2E = '0';
    jest.resetModules();

    const { default: ListingPage } = await import('../listings/[slug]/page');

    const element = await ListingPage({ params: { slug: 'banyan-tree-phuket' } });
    render(element);

    expect(screen.getByTestId('listing-content-stub')).toHaveTextContent('banyan-tree-phuket');
    expect(listingContentMock).toHaveBeenCalledWith({ slug: 'banyan-tree-phuket' });
  });

  it('bubbles notFound when ListingContent triggers it', async () => {
    process.env.NEXT_PUBLIC_E2E = '1';
    process.env.E2E = '0';
    jest.resetModules();

    listingContentMock.mockImplementationOnce(() => notFoundMock());

    const { default: ListingPage } = await import('../listings/[slug]/page');

    await expect(ListingPage({ params: { slug: 'missing-slug' } })).rejects.toThrow(
      'NEXT_NOT_FOUND'
    );
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it('passes through non-E2E slugs to ListingContent', async () => {
    process.env.NEXT_PUBLIC_E2E = '0';
    process.env.E2E = '0';
    jest.resetModules();

    const { default: ListingPage } = await import('../listings/[slug]/page');

    const element = await ListingPage({ params: { slug: 'eco-stay-retreat' } });
    render(element);

    expect(screen.getByTestId('listing-content-stub')).toHaveTextContent('eco-stay-retreat');
    expect(listingContentMock).toHaveBeenCalledWith({ slug: 'eco-stay-retreat' });
  });
});

describe('ListingPage metadata', () => {
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
      params: { slug: 'meta-listing' },
    } as any);

    expect(metadata).toEqual(
      expect.objectContaining({
        title: 'Meta Listing',
        description: 'A great place to stay',
        openGraph: expect.objectContaining({ images: ['/primary.jpg'] }),
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
      params: { slug: 'broken-listing' },
    } as any);

    expect(metadata).toEqual({ title: 'Listing not found' });
  });
});

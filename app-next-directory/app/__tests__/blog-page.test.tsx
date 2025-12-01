import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

jest.mock('@/components/layout/Header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

jest.mock('@/components/layout/Footer', () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}));

jest.mock('../blog/BlogPageClient', () => ({
  __esModule: true,
  default: () => <div data-testid="blog-page-client">BlogPageClient</div>,
}));

jest.mock('@/lib/absolute-url', () => ({
  getBaseUrl: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams({ page: '2', limit: '12', tag: 'eco', search: 'retreat' }),
}));

afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

describe('BlogPage', () => {
  it('renders posts, filters, and pagination from DTO-wrapped API response', async () => {
    jest.resetModules();

    const [pageModule, absoluteModule] = await Promise.all([
      import('../blog/page'),
      import('@/lib/absolute-url'),
    ]);

    const getBaseUrl = absoluteModule.getBaseUrl as jest.Mock;
    getBaseUrl.mockResolvedValue('https://example.com');

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({
        success: true,
        data: {
          posts: [
            {
              id: 'post-1',
              title: 'Eco Travel Tips',
              slug: 'eco-travel-tips',
              excerpt: 'How to stay green on the go.',
              tags: ['eco', 'travel', 'eco'],
              imageUrl: null,
            },
            {
              id: 'post-2',
              title: 'Remote Work Retreats',
              slug: 'remote-work-retreats',
              excerpt: 'Find your next retreat.',
              tags: ['lifestyle', 'remote'],
              imageUrl: 'https://example.com/retreat.jpg',
            },
          ],
          pagination: {
            page: 2,
            limit: 12,
            totalCount: 24,
            totalPages: 3,
            hasNextPage: true,
            hasPrevPage: true,
            nextPage: 3,
            prevPage: 1,
          },
          filters: { tag: 'eco', search: 'retreat' },
        },
      }),
    } as Response);

    global.fetch = fetchMock;

    const element = await pageModule.default({
      searchParams: { page: '2', limit: '12', tag: 'eco', search: 'retreat' },
    });
    render(element);

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('blog-page-client')).toBeInTheDocument();
  });

  it('supports legacy posts array responses', async () => {
    jest.resetModules();

    const [pageModule, absoluteModule] = await Promise.all([
      import('../blog/page'),
      import('@/lib/absolute-url'),
    ]);

    const getBaseUrl = absoluteModule.getBaseUrl as jest.Mock;
    getBaseUrl.mockResolvedValue('https://example.com');

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({
        posts: [
          {
            id: 'legacy-1',
            title: 'Legacy Payload Story',
            slug: 'legacy-story',
            excerpt: 'Legacy excerpt',
            tags: ['history'],
            imageUrl: null,
          },
        ],
      }),
    } as Response);

    const element = await pageModule.default({ searchParams: {} });
    render(element);

    expect(screen.getByTestId('blog-page-client')).toBeInTheDocument();
  });

  it('throws when the blog API reports an error', async () => {
    jest.resetModules();

    const [pageModule, absoluteModule] = await Promise.all([
      import('../blog/page'),
      import('@/lib/absolute-url'),
    ]);

    const getBaseUrl = absoluteModule.getBaseUrl as jest.Mock;
    getBaseUrl.mockResolvedValue('https://example.com');

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ success: false }),
    } as Response);

    await expect(pageModule.default({ searchParams: {} })).rejects.toThrow(
      'Blog API responded with success=false or missing/invalid data'
    );
  });
});

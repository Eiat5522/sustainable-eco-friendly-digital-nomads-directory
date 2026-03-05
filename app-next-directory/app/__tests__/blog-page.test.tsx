import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

jest.mock('@/components/layout/PageLayoutServer', () => ({
  PageLayoutServer: ({ children }: { children: React.ReactNode }) => (
    <div>
      <div data-testid="header">Header</div>
      <main>{children}</main>
      <div data-testid="footer">Footer</div>
    </div>
  ),
}));

jest.mock('@/lib/absolute-url', () => ({
  getBaseUrl: jest.fn(),
}));

const originalFetch = global.fetch;

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
    expect(screen.getByText("The Nomad's Chronicle")).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/api/blog?page=2&limit=12&tag=eco&search=retreat',
      expect.any(Object)
    );

    expect(screen.getByText('Eco Travel Tips')).toBeInTheDocument();
    expect(screen.getByText('Remote Work Retreats')).toBeInTheDocument();

    expect(screen.getAllByText('#eco')).toHaveLength(1);
    expect(screen.getByText('#travel')).toBeInTheDocument();
    expect(screen.getByText('#lifestyle')).toBeInTheDocument();

    const imageSources = screen.getAllByRole('img').map(img => img.getAttribute('src'));
    expect(imageSources).toEqual(expect.arrayContaining(['https://example.com/retreat.jpg']));

    const previousLink = screen.getByRole('link', { name: '← Previous' });
    expect(previousLink).toHaveAttribute('href', '/blog?page=1&tag=eco&search=retreat&limit=12');

    const nextLink = screen.getByRole('link', { name: 'Next →' });
    expect(nextLink).toHaveAttribute('href', '/blog?page=3&tag=eco&search=retreat&limit=12');
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

    expect(screen.getByText('Legacy Payload Story')).toBeInTheDocument();
    const paginationText = screen.getByText('Page 1 of 1');
    expect(paginationText).toBeInTheDocument();
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
      'Blog API responded with success=false'
    );
  });
});

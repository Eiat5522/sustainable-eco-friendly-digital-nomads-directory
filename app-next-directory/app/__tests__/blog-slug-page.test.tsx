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

jest.mock('@portabletext/react', () => ({
  PortableText: ({ value }: { value: unknown }) => (
    <div data-testid="portable-text">{JSON.stringify(value)}</div>
  ),
}));

jest.mock('@/components/layout/PageLayoutServer', () => ({
  PageLayoutServer: ({ children }: { children: React.ReactNode }) => (
    <div>
      <div data-testid="header">Header</div>
      <main>{children}</main>
      <div data-testid="footer">Footer</div>
    </div>
  ),
}));

jest.mock('@/components/CommentForm', () => ({
  __esModule: true,
  default: ({ postId }: { postId: string }) => (
    <div data-testid="comment-form">form-for-{postId}</div>
  ),
}));

jest.mock('@/components/CommentList', () => ({
  __esModule: true,
  default: ({ comments }: { comments: unknown[] }) => (
    <div data-testid="comment-list">comments:{comments?.length ?? 0}</div>
  ),
}));

jest.mock('@/lib/absolute-url', () => ({
  getBaseUrl: jest.fn(),
}));

jest.mock('@/lib/sanity/client', () => ({
  client: { fetch: jest.fn() },
}));

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

describe('BlogPostPage', () => {
  it('renders post content, placeholder hero, and comments from DTO response', async () => {
    jest.resetModules();

    const [pageModule, absoluteModule, clientModule] = await Promise.all([
      import('../blog/[slug]/page'),
      import('@/lib/absolute-url'),
      import('@/lib/sanity/client'),
    ]);

    const getBaseUrl = absoluteModule.getBaseUrl as jest.Mock;
    const sanityFetch = clientModule.client.fetch as jest.Mock;

    getBaseUrl.mockResolvedValue('https://example.com');

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { get: () => 'application/json' },
      json: async () => ({
        success: true,
        data: {
          post: {
            id: 'post-123',
            title: 'Sustainable Journey',
            body: [{ _type: 'block', children: [] }],
            imageUrl: null,
          },
        },
      }),
    } as Response);

    sanityFetch.mockResolvedValue([
      { _id: 'comment-1', content: 'Great read', user: { name: 'Alex' } },
    ]);

    const element = await pageModule.default({
      params: Promise.resolve({ slug: 'sustainable-journey' }),
    });
    render(element);

    expect(screen.getByText('Sustainable Journey')).toBeInTheDocument();
    expect(screen.getByTestId('portable-text')).toBeInTheDocument();
    expect(screen.getByTestId('comment-list')).toHaveTextContent('comments:1');
    expect(screen.getByTestId('comment-form')).toHaveTextContent('form-for-post-123');

    const hero = screen.getByRole('presentation', { hidden: true });
    expect(hero).toHaveAttribute('aria-hidden', 'true');
  });

  it('supports legacy post payloads with explicit comments', async () => {
    jest.resetModules();

    const [pageModule, absoluteModule, clientModule] = await Promise.all([
      import('../blog/[slug]/page'),
      import('@/lib/absolute-url'),
      import('@/lib/sanity/client'),
    ]);

    const getBaseUrl = absoluteModule.getBaseUrl as jest.Mock;
    const sanityFetch = clientModule.client.fetch as jest.Mock;

    getBaseUrl.mockResolvedValue('https://example.com');

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { get: () => 'application/json' },
      json: async () => ({
        post: {
          id: 'legacy-001',
          title: 'Legacy Post',
          body: [{ _type: 'legacy', children: [] }],
          imageUrl: 'https://example.com/hero.jpg',
        },
        comments: [{ _id: 'comment-legacy', content: 'Legacy comment' }],
      }),
    } as Response);

    sanityFetch.mockResolvedValue([
      { _id: 'comment-legacy', content: 'Legacy comment', user: { name: 'Taylor' } },
    ]);

    const element = await pageModule.default({ params: Promise.resolve({ slug: 'legacy-post' }) });
    render(element);

    expect(screen.getByText('Legacy Post')).toBeInTheDocument();
    const hero = screen.getByRole('img');
    expect(hero).toHaveAttribute('aria-hidden', 'false');
    expect(hero).toHaveAttribute('src', 'https://example.com/hero.jpg');
  });

  it('handles minimal fallback payloads lacking DTO wrappers', async () => {
    jest.resetModules();

    const [pageModule, absoluteModule, clientModule] = await Promise.all([
      import('../blog/[slug]/page'),
      import('@/lib/absolute-url'),
      import('@/lib/sanity/client'),
    ]);

    const getBaseUrl = absoluteModule.getBaseUrl as jest.Mock;
    const sanityFetch = clientModule.client.fetch as jest.Mock;

    getBaseUrl.mockResolvedValue('https://example.com');

    const originalFetch = global.fetch;
    try {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: { get: () => 'application/json' },
        json: async () => ({
          _id: 'fallback-1',
          title: 'Fallback Format',
          body: [],
          primaryImage: { asset: { url: 'https://example.com/fallback.jpg' } },
        }),
      } as Response);

      sanityFetch.mockResolvedValue([]);

      const element = await pageModule.default({
        params: Promise.resolve({ slug: 'fallback-format' }),
      });
      render(element);

      expect(screen.getByText('Fallback Format')).toBeInTheDocument();
      const hero = screen.getByRole('img');
      expect(hero).toHaveAttribute('src', 'https://example.com/fallback.jpg');
      expect(screen.getByTestId('comment-list')).toHaveTextContent('comments:0');
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('invokes notFound when API returns 404', async () => {
    jest.resetModules();

    const [pageModule, absoluteModule] = await Promise.all([
      import('../blog/[slug]/page'),
      import('@/lib/absolute-url'),
    ]);

    const getBaseUrl = absoluteModule.getBaseUrl as jest.Mock;
    getBaseUrl.mockResolvedValue('https://example.com');

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: { get: () => 'application/json' },
      json: async () => ({}),
    } as Response);

    await expect(
      pageModule.default({ params: Promise.resolve({ slug: 'missing-post' }) })
    ).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});

describe('BlogPostPage.generateMetadata', () => {
  it('returns metadata derived from DTO response with relative image', async () => {
    jest.resetModules();

    const [pageModule, absoluteModule] = await Promise.all([
      import('../blog/[slug]/page'),
      import('@/lib/absolute-url'),
    ]);

    const getBaseUrl = absoluteModule.getBaseUrl as jest.Mock;
    getBaseUrl.mockResolvedValue('https://example.com');

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({
        success: true,
        data: {
          post: {
            title: 'Meta Post',
            excerpt: 'Meta description',
            imageUrl: '/images/meta.jpg',
          },
        },
      }),
    } as Response);

    const metadata = await pageModule.generateMetadata({
      params: Promise.resolve({ slug: 'meta-post' }),
    });
    expect(metadata).toEqual(
      expect.objectContaining({
        title: 'Meta Post',
        description: 'Meta description',
        openGraph: expect.objectContaining({
          images: [{ url: 'https://example.com/images/meta.jpg' }],
        }),
        twitter: expect.objectContaining({
          images: ['https://example.com/images/meta.jpg'],
        }),
      })
    );
  });

  it('returns not found metadata when API returns 404', async () => {
    jest.resetModules();

    const [pageModule, absoluteModule] = await Promise.all([
      import('../blog/[slug]/page'),
      import('@/lib/absolute-url'),
    ]);

    const getBaseUrl = absoluteModule.getBaseUrl as jest.Mock;
    getBaseUrl.mockResolvedValue('https://example.com');

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({}),
    } as Response);

    const metadata = await pageModule.generateMetadata({
      params: Promise.resolve({ slug: 'missing-post' }),
    });
    expect(metadata).toEqual({ title: 'Post not found' });
  });

  it('falls back to generic metadata when the fetch fails', async () => {
    jest.resetModules();

    const [pageModule, absoluteModule] = await Promise.all([
      import('../blog/[slug]/page'),
      import('@/lib/absolute-url'),
    ]);

    const getBaseUrl = absoluteModule.getBaseUrl as jest.Mock;
    getBaseUrl.mockResolvedValue('https://example.com');

    global.fetch = jest.fn().mockRejectedValue(new Error('network failure'));

    const metadata = await pageModule.generateMetadata({
      params: Promise.resolve({ slug: 'meta-error' }),
    });
    expect(metadata).toEqual({ title: 'Blog' });
  });

  it('returns summary card metadata when image and excerpt are missing', async () => {
    jest.resetModules();

    const [pageModule, absoluteModule] = await Promise.all([
      import('../blog/[slug]/page'),
      import('@/lib/absolute-url'),
    ]);

    const getBaseUrl = absoluteModule.getBaseUrl as jest.Mock;
    getBaseUrl.mockResolvedValue('https://example.com');

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({
        success: true,
        data: { post: { title: 'Meta Fallback' } },
      }),
    } as Response);

    const metadata = await pageModule.generateMetadata({
      params: Promise.resolve({ slug: 'meta-fallback' }),
    });

    expect(metadata).toEqual(
      expect.objectContaining({
        title: 'Meta Fallback',
        description: undefined,
        openGraph: expect.objectContaining({ images: undefined }),
        twitter: expect.objectContaining({ card: 'summary', images: undefined }),
      })
    );
  });
});

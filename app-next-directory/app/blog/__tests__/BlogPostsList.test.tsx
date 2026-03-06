/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { BlogPostsList } from '../BlogPostsList';

// Mock Next.js components
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// Mock server functions
jest.mock('@/lib/absolute-url', () => ({
  getBaseUrl: jest.fn().mockResolvedValue('http://localhost:3000'),
}));

jest.mock('@/lib/server/headers', () => ({
  getSafeHeaders: jest.fn().mockResolvedValue({}),
}));

jest.mock('../data', () => ({
  getPostsCached: jest.fn(),
}));

const { getPostsCached } = require('../data');

describe('BlogPostsList', () => {
  const mockPosts = [
    {
      id: '1',
      title: 'First Post',
      slug: 'first-post',
      excerpt: 'This is the first post',
      tags: ['eco', 'remote-work'],
      imageUrl: 'https://example.com/image1.jpg',
    },
    {
      id: '2',
      title: 'Second Post',
      slug: 'second-post',
      excerpt: 'This is the second post',
      tags: ['eco'],
      imageUrl: null,
    },
    {
      id: '3',
      title: 'Third Post',
      slug: 'third-post',
      excerpt: 'This is the third post',
      tags: ['travel'],
      imageUrl: 'https://example.com/image3.jpg',
    },
  ];

  const mockPagination = {
    page: 1,
    limit: 10,
    totalCount: 3,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
    nextPage: null,
    prevPage: null,
  };

  const mockUniqueTags = ['eco', 'remote-work', 'travel'];

  beforeEach(() => {
    jest.clearAllMocks();
    getPostsCached.mockResolvedValue({
      posts: mockPosts,
      pagination: mockPagination,
      uniqueTags: mockUniqueTags,
    });
  });

  it('should render the page title', async () => {
    const component = await BlogPostsList({ searchParams: {} });
    render(component);

    expect(screen.getByText("The Nomad's Chronicle")).toBeInTheDocument();
  });

  it('should render the main heading', async () => {
    const component = await BlogPostsList({ searchParams: {} });
    render(component);

    expect(screen.getByText('Stories for Sustainable Nomads')).toBeInTheDocument();
  });

  it('should render all blog posts', async () => {
    const component = await BlogPostsList({ searchParams: {} });
    render(component);

    expect(screen.getByText('First Post')).toBeInTheDocument();
    expect(screen.getByText('Second Post')).toBeInTheDocument();
    expect(screen.getByText('Third Post')).toBeInTheDocument();
  });

  it('should render post excerpts', async () => {
    const component = await BlogPostsList({ searchParams: {} });
    render(component);

    expect(screen.getByText('This is the first post')).toBeInTheDocument();
    expect(screen.getByText('This is the second post')).toBeInTheDocument();
    expect(screen.getByText('This is the third post')).toBeInTheDocument();
  });

  it('should render search form with default values', async () => {
    const component = await BlogPostsList({ searchParams: {} });
    render(component);

    const searchInput = screen.getByPlaceholderText('Search posts...');
    const tagInput = screen.getByPlaceholderText('Filter by tag');
    const applyButton = screen.getByText('Apply');

    expect(searchInput).toBeInTheDocument();
    expect(tagInput).toBeInTheDocument();
    expect(applyButton).toBeInTheDocument();
  });

  it('should populate search form with query parameters', async () => {
    const component = await BlogPostsList({
      searchParams: { search: 'nomad', tag: 'eco' },
    });
    render(component);

    const searchInput = screen.getByPlaceholderText('Search posts...') as HTMLInputElement;
    const tagInput = screen.getByPlaceholderText('Filter by tag') as HTMLInputElement;

    expect(searchInput.defaultValue).toBe('nomad');
    expect(tagInput.defaultValue).toBe('eco');
  });

  it('should render unique tags', async () => {
    const component = await BlogPostsList({ searchParams: {} });
    render(component);

    // Tags in the filter section have a specific class structure or parent
    const filterSection = screen.getByText('Stories for Sustainable Nomads').closest('section');
    expect(filterSection).toBeInTheDocument();

    expect(screen.getAllByText('#eco').some(el => filterSection?.contains(el))).toBe(true);
    expect(screen.getAllByText('#remote-work').some(el => filterSection?.contains(el))).toBe(true);
    expect(screen.getAllByText('#travel').some(el => filterSection?.contains(el))).toBe(true);
  });

  it('should not render tags section when no tags available', async () => {
    getPostsCached.mockResolvedValue({
      posts: mockPosts,
      pagination: mockPagination,
      uniqueTags: [],
    });

    const component = await BlogPostsList({ searchParams: {} });
    render(component);

    const filterSection = screen.getByText('Stories for Sustainable Nomads').closest('section');
    // The tags container in the filter section has mt-5
    const tagsContainer = filterSection?.querySelector('.mt-5.flex.flex-wrap');
    expect(tagsContainer).not.toBeInTheDocument();
  });

  it('should render pagination with correct current page', async () => {
    const component = await BlogPostsList({ searchParams: { page: '1' } });
    render(component);

    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
    expect(screen.getByText('1 / 1')).toBeInTheDocument();
  });

  it('should render next page link when hasNextPage is true', async () => {
    getPostsCached.mockResolvedValue({
      posts: mockPosts,
      pagination: {
        ...mockPagination,
        page: 1,
        totalPages: 2,
        hasNextPage: true,
        nextPage: 2,
      },
      uniqueTags: mockUniqueTags,
    });

    const component = await BlogPostsList({ searchParams: {} });
    render(component);

    const nextLink = screen.getByText('Next');
    expect(nextLink).toBeInTheDocument();
    expect(nextLink.closest('a')).toHaveAttribute('href', '/blog?page=2');
  });

  it('should render previous page link when hasPrevPage is true', async () => {
    getPostsCached.mockResolvedValue({
      posts: mockPosts,
      pagination: {
        ...mockPagination,
        page: 2,
        totalPages: 2,
        hasPrevPage: true,
        prevPage: 1,
      },
      uniqueTags: mockUniqueTags,
    });

    const component = await BlogPostsList({ searchParams: { page: '2' } });
    render(component);

    const prevLink = screen.getByText('Prev');
    expect(prevLink).toBeInTheDocument();
    expect(prevLink.closest('a')).toHaveAttribute('href', '/blog?page=1');
  });

  it('should not render pagination links when on single page', async () => {
    const component = await BlogPostsList({ searchParams: {} });
    render(component);

    expect(screen.queryByText('Next')).not.toBeInTheDocument();
    expect(screen.queryByText('Prev')).not.toBeInTheDocument();
  });

  it('should render posts with correct links', async () => {
    const component = await BlogPostsList({ searchParams: {} });
    render(component);

    const firstPostLink = screen.getByText('First Post').closest('a');
    expect(firstPostLink).toHaveAttribute('href', '/blog/first-post');

    const secondPostLink = screen.getByText('Second Post').closest('a');
    expect(secondPostLink).toHaveAttribute('href', '/blog/second-post');
  });

  it('should call getPostsCached with correct parameters', async () => {
    await BlogPostsList({ searchParams: { page: '2', limit: '5', tag: 'eco', search: 'test' } });

    expect(getPostsCached).toHaveBeenCalledWith({
      baseUrl: 'http://localhost:3000',
      page: '2',
      limit: '5',
      tag: 'eco',
      search: 'test',
    });
  });

  it('should render images with correct src for posts with imageUrl', async () => {
    const component = await BlogPostsList({ searchParams: {} });
    render(component);

    const images = screen.getAllByRole('img');
    const firstImage = images.find(
      img => img.getAttribute('alt') === 'First Post'
    ) as HTMLImageElement;
    expect(firstImage.src).toContain('image1.jpg');
  });

  it('should render placeholder for posts without imageUrl', async () => {
    const component = await BlogPostsList({ searchParams: {} });
    const { container } = render(component);
  });

  it('should preserve search and tag in pagination links', async () => {
    getPostsCached.mockResolvedValue({
      posts: mockPosts,
      pagination: {
        ...mockPagination,
        page: 1,
        totalPages: 2,
        hasNextPage: true,
        nextPage: 2,
      },
      uniqueTags: mockUniqueTags,
    });

    const component = await BlogPostsList({ searchParams: { search: 'nomad', tag: 'eco' } });
    render(component);

    const nextLink = screen.getByText('Next').closest('a');
    expect(nextLink?.getAttribute('href')).toContain('page=2');
    expect(nextLink?.getAttribute('href')).toContain('search=nomad');
    expect(nextLink?.getAttribute('href')).toContain('tag=eco');
  });

  it('should render form with correct action', async () => {
    const component = await BlogPostsList({ searchParams: {} });
    const { container } = render(component);

    const form = container.querySelector('form');
    expect(form).toHaveAttribute('action', '/blog');
    expect(form).toHaveAttribute('method', 'get');
  });

  it('should include hidden limit input when limit is provided', async () => {
    const component = await BlogPostsList({ searchParams: { limit: '20' } });
    const { container } = render(component);

    const hiddenInput = container.querySelector('input[name="limit"]') as HTMLInputElement;
    expect(hiddenInput).toBeInTheDocument();
    expect(hiddenInput.value).toBe('20');
  });

  it('should not include hidden limit input when limit is not provided', async () => {
    const component = await BlogPostsList({ searchParams: {} });
    const { container } = render(component);

    const hiddenInput = container.querySelector('input[name="limit"]');
    expect(hiddenInput).not.toBeInTheDocument();
  });

  it('should highlight active tag', async () => {
    const component = await BlogPostsList({ searchParams: { tag: 'eco' } });
    render(component);

    // Use getAllByText for tags because they may appear in the filter list AND post cards
    const ecoTag = screen
      .getAllByText('#eco')
      .find(el => el.closest('div')?.className.includes('flex-wrap'));
    expect(ecoTag).toHaveClass('bg-neo-border', 'text-neo-surface');

    const remoteWorkTag = screen
      .getAllByText('#remote-work')
      .find(el => el.closest('div')?.className.includes('flex-wrap'));
    expect(remoteWorkTag).toHaveClass('bg-neo-surface');
    expect(remoteWorkTag).not.toHaveClass('bg-neo-border');
  });

  it('should render tag links with correct href', async () => {
    const component = await BlogPostsList({ searchParams: {} });
    render(component);

    const ecoTagLink = screen.getAllByText('#eco').find(el => el.tagName === 'A');
    expect(ecoTagLink).toHaveAttribute('href', '/blog?tag=eco');
  });

  it('should preserve search in tag links', async () => {
    const component = await BlogPostsList({ searchParams: { search: 'nomad' } });
    render(component);

    const ecoTagLink = screen.getAllByText('#eco').find(el => el.tagName === 'A');
    expect(ecoTagLink?.getAttribute('href')).toContain('tag=eco');
    expect(ecoTagLink?.getAttribute('href')).toContain('search=nomad');
  });
});

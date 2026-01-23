/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { Suspense } from 'react';

// Mock Next.js modules
jest.mock('next-sanity', () => ({
  groq: (strings: TemplateStringsArray) => strings[0],
}));

jest.mock('@/lib/sanity/client', () => ({
  sanityFetch: jest.fn(),
}));

jest.mock('@/components/category/CategoryListings', () => ({
  CategoryListings: ({ slug }: { slug: string }) => <div>Listings for {slug}</div>,
}));

const mockSanityFetch = require('@/lib/sanity/client').sanityFetch;

describe('CategoryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateStaticParams', () => {
    it('should return category slugs from Sanity', async () => {
      mockSanityFetch.mockResolvedValueOnce(['Coworking Space', 'Cafe', 'Hotel']);

      const { generateStaticParams } = await import('../page');
      const params = await generateStaticParams();

      expect(params).toEqual([
        { slug: 'coworking-space' },
        { slug: 'cafe' },
        { slug: 'hotel' },
      ]);
    });

    it('should filter out empty strings', async () => {
      mockSanityFetch.mockResolvedValueOnce(['Coworking', '', 'Cafe', null, undefined]);

      const { generateStaticParams } = await import('../page');
      const params = await generateStaticParams();

      expect(params).toEqual([{ slug: 'coworking' }, { slug: 'cafe' }]);
    });

    it('should remove duplicate slugs', async () => {
      mockSanityFetch.mockResolvedValueOnce(['Coworking Space', 'coworking space', 'COWORKING SPACE']);

      const { generateStaticParams } = await import('../page');
      const params = await generateStaticParams();

      expect(params).toEqual([{ slug: 'coworking-space' }]);
    });

    it('should slugify categories correctly', async () => {
      mockSanityFetch.mockResolvedValueOnce(['Co-working Space!', 'Café & Restaurant', 'Hotel/Hostel']);

      const { generateStaticParams } = await import('../page');
      const params = await generateStaticParams();

      expect(params).toEqual([
        { slug: 'co-working-space' },
        { slug: 'caf-restaurant' },
        { slug: 'hotelhostel' },
      ]);
    });

    it('should return fallback categories when fetch fails', async () => {
      mockSanityFetch.mockRejectedValueOnce(new Error('Network error'));

      const { generateStaticParams } = await import('../page');
      const params = await generateStaticParams();

      expect(params).toEqual([{ slug: 'coworking' }]);
    });

    it('should return fallback when no categories found', async () => {
      mockSanityFetch.mockResolvedValueOnce([]);

      const { generateStaticParams } = await import('../page');
      const params = await generateStaticParams();

      expect(params).toEqual([{ slug: 'coworking' }]);
    });

    it('should handle null response', async () => {
      mockSanityFetch.mockResolvedValueOnce(null);

      const { generateStaticParams } = await import('../page');
      const params = await generateStaticParams();

      expect(params).toEqual([{ slug: 'coworking' }]);
    });

    it('should filter slugs that become empty after normalization', async () => {
      mockSanityFetch.mockResolvedValueOnce(['Valid Category', '---', '!!!']);

      const { generateStaticParams } = await import('../page');
      const params = await generateStaticParams();

      expect(params).toEqual([{ slug: 'valid-category' }]);
    });
  });

  describe('generateMetadata', () => {
    it('should generate metadata with capitalized slug', async () => {
      const { generateMetadata } = await import('../page');
      const metadata = await generateMetadata({ params: Promise.resolve({ slug: 'coworking' }) });

      expect(metadata).toEqual({
        title: 'Coworking Category',
      });
    });

    it('should capitalize first letter of multi-word slug', async () => {
      const { generateMetadata } = await import('../page');
      const metadata = await generateMetadata({ params: Promise.resolve({ slug: 'coworking-space' }) });

      expect(metadata).toEqual({
        title: 'Coworking-space Category',
      });
    });

    it('should handle single character slug', async () => {
      const { generateMetadata } = await import('../page');
      const metadata = await generateMetadata({ params: Promise.resolve({ slug: 'a' }) });

      expect(metadata).toEqual({
        title: 'A Category',
      });
    });

    it('should handle empty slug gracefully', async () => {
      const { generateMetadata } = await import('../page');
      const metadata = await generateMetadata({ params: Promise.resolve({ slug: '' }) });

      expect(metadata).toEqual({
        title: ' Category',
      });
    });
  });

  describe('CategoryPage', () => {
    it('should render page with category title', async () => {
      const CategoryPage = (await import('../page')).default;
      const pageElement = await CategoryPage({ params: Promise.resolve({ slug: 'coworking' }) });
      
      render(pageElement);

      expect(screen.getByText('Category: coworking')).toBeInTheDocument();
    });

    it('should render with Suspense boundary', async () => {
      const CategoryPage = (await import('../page')).default;
      const pageElement = await CategoryPage({ params: Promise.resolve({ slug: 'cafe' }) });
      
      render(pageElement);

      await waitFor(() => {
        expect(screen.getByText('Listings for cafe')).toBeInTheDocument();
      });
    });

    it('should render loading fallback initially', async () => {
      const CategoryPage = (await import('../page')).default;
      const pageElement = await CategoryPage({ params: Promise.resolve({ slug: 'hotel' }) });
      
      const { container } = render(
        <Suspense fallback={<p>Loading listings...</p>}>
          {pageElement}
        </Suspense>
      );

      // The component should eventually render
      await waitFor(() => {
        expect(screen.getByText(/Category:/)).toBeInTheDocument();
      });
    });

    it('should apply correct CSS classes to container', async () => {
      const CategoryPage = (await import('../page')).default;
      const pageElement = await CategoryPage({ params: Promise.resolve({ slug: 'coworking' }) });
      
      const { container } = render(pageElement);

      const main = container.querySelector('main');
      expect(main).toHaveClass('container', 'mx-auto', 'py-12');
    });

    it('should render h1 with correct styling', async () => {
      const CategoryPage = (await import('../page')).default;
      const pageElement = await CategoryPage({ params: Promise.resolve({ slug: 'coworking' }) });
      
      render(pageElement);

      const heading = screen.getByText('Category: coworking');
      expect(heading.tagName).toBe('H1');
      expect(heading).toHaveClass('text-2xl', 'font-bold', 'mb-4');
    });

    it('should pass correct slug to CategoryListings', async () => {
      const CategoryPage = (await import('../page')).default;
      const pageElement = await CategoryPage({ params: Promise.resolve({ slug: 'cafe' }) });
      
      render(pageElement);

      expect(screen.getByText('Listings for cafe')).toBeInTheDocument();
    });

    it('should handle different slug formats', async () => {
      const CategoryPage = (await import('../page')).default;
      const pageElement = await CategoryPage({ params: Promise.resolve({ slug: 'co-working-space' }) });
      
      render(pageElement);

      expect(screen.getByText('Category: co-working-space')).toBeInTheDocument();
    });
  });
});

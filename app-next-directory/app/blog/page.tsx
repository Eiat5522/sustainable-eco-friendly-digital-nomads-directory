import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { headers } from 'next/headers';

// Images come preprocessed via DTOs (see API). No builder needed here.

// Lightweight, subtle SVG gradient placeholder as data URI
const placeholderCache = new Map<string, string>();

function placeholderDataUri(width = 800, height = 450) {
  const key = `${width}x${height}`;
  if (placeholderCache.has(key)) {
    return placeholderCache.get(key)!;
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#f3f4f6'/><stop offset='1' stop-color='#e5e7eb'/></linearGradient></defs><rect width='100%' height='100%' fill='url(#g)'/></svg>`;
  const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  placeholderCache.set(key, dataUri);
  return dataUri;
}

import type { Metadata } from 'next';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { BlogPostsList } from './BlogPostsList'; // Import the new component

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  tags?: string[];
  imageUrl?: string | null;
};

type BlogApiResponse = {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPage: number | null;
    prevPage: number | null;
  };
  filters: { tag: string | null; search: string | null };
};

// Use cached server helper to avoid uncached fetches during prerender

export const metadata: Metadata = {
  title: "The Nomad's Chronicle – Blog",
  description: 'Stories, tips, and sustainability insights for digital nomads.',
};

export default async function BlogPage(
  props: Readonly<{
    searchParams?: { page?: string; limit?: string; tag?: string; search?: string };
  }>
) {
  const { page = '1', limit = '10', tag = '', search = '' } = props.searchParams || {};
  const searchParamsForPosts = { page, limit, tag, search };

  return (
    <>
      <Suspense fallback={<div>Loading header...</div>}>
        <Header />
      </Suspense>
      <Suspense fallback={<div>Loading blog posts...</div>}>
        <BlogPostsList searchParams={searchParamsForPosts} /> {/* Use the new component */}
      </Suspense>
      <Suspense fallback={<div>Loading footer...</div>}>
        <Footer />
      </Suspense>
    </>
  );
}

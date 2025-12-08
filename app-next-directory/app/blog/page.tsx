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
import { getPostsCached } from './data';

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
  const searchParams = await props.searchParams;
  
  // FORTEST: Wrap headers() in try-catch for compatibility with prerender
  let _h =
    null as
      | null
      | Awaited<ReturnType<typeof headers>>
      | { get(name: string): string | null | undefined };
  try {
    _h = await headers();
  } catch {
    _h = null;
  }
  
  // Support Next 14 (sync) and Next 15 (async) searchParams
  const sp = await Promise.resolve((searchParams ?? {}) as Record<string, string>);
  const { page, limit, tag, search } = sp;
  const { posts, pagination } = await getPostsCached({ page, limit, tag, search, headersParam: _h });

  const uniqueTags = Array.from(
    new Set(
      posts
        .flatMap((p: Post) => (Array.isArray(p.tags) ? p.tags : []))
        .map(t => (typeof t === 'string' ? t.trim() : ''))
        .filter((t): t is string => t.length > 0)
    )
  ).slice(0, 20);

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-5xl font-extrabold text-center mb-6 text-gray-900">
          The Nomad&apos;s Chronicle
        </h1>

        {/* Filters */}
        <form
          className="mb-10 flex flex-col md:flex-row items-stretch md:items-center gap-3"
          action="/blog"
          method="get"
        >
          <input
            type="search"
            name="search"
            defaultValue={search || ''}
            placeholder="Search posts..."
            className="flex-1 p-3 bg-white border-4 border-black rounded-lg shadow-sm"
          />
          <input
            type="text"
            name="tag"
            defaultValue={tag || ''}
            placeholder="Tag (e.g. eco, remote-work)"
            className="w-full md:w-64 p-3 bg-white border-4 border-black rounded-lg shadow-sm"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-yellow-400 border-4 border-black rounded-lg font-bold"
          >
            Apply
          </button>
          {limit ? <input type="hidden" name="limit" value={limit} /> : null}
        </form>

        {uniqueTags.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {uniqueTags.map(t => {
              const sp = new URLSearchParams();
              if (t) sp.set('tag', t);
              if (search) sp.set('search', search);
              if (limit) sp.set('limit', limit);
              return (
                <Link
                  key={t}
                  href={`/blog?${sp.toString()}`}
                  className={`px-3 py-1 border-2 border-black rounded-full text-sm ${t === tag ? 'bg-black text-white' : 'bg-white'}`}
                >
                  #{t}
                </Link>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post: Post, idx: number) => {
            const imageUrl = post.imageUrl ?? null;
            const usingPlaceholder = !imageUrl;
            const src = imageUrl ?? placeholderDataUri(800, 450);
            const alt = usingPlaceholder ? '' : post.title || '';
            return (
              <Link key={post.id} href={`/blog/${post.slug}`} className="flex">
                <div className="flex flex-col w-full bg-white border-4 border-black rounded-lg shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 ease-in-out overflow-hidden">
                  <div className="relative h-48 flex-shrink-0">
                    <Image
                      src={src}
                      alt={alt}
                      aria-hidden={usingPlaceholder}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      priority={idx < 3}
                    />
                  </div>
                  <div className="p-6 flex-grow">
                    <h2 className="text-3xl font-bold mb-2 text-gray-800">{post.title}</h2>
                    <p className="text-gray-600">{post.excerpt}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Pagination */}
        <div className="mt-10 flex items-center justify-center gap-4">
          {pagination.hasPrevPage && (
            <Link
              href={`/blog?${new URLSearchParams({
                page: String(pagination.prevPage ?? 1),
                ...(tag ? { tag } : {}),
                ...(search ? { search } : {}),
                ...(limit ? { limit } : {}),
              }).toString()}`}
              className="px-4 py-2 border-4 border-black rounded-lg bg-white"
            >
              ← Previous
            </Link>
          )}
          <span className="text-sm text-gray-700">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          {pagination.hasNextPage && (
            <Link
              href={`/blog?${new URLSearchParams({
                page: String(pagination.nextPage ?? pagination.page + 1),
                ...(tag ? { tag } : {}),
                ...(search ? { search } : {}),
                ...(limit ? { limit } : {}),
              }).toString()}`}
              className="px-4 py-2 border-4 border-black rounded-lg bg-white"
            >
              Next →
            </Link>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

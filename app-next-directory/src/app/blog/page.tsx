
import Link from 'next/link';
import Image from 'next/image';
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
import { getBaseUrl } from '@/lib/absolute-url';
import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

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

async function getPosts(params: { page?: string; limit?: string; tag?: string; search?: string }): Promise<BlogApiResponse> {
  const base = await getBaseUrl();
  const url = new URL('/api/blog', base);
  if (params.page) url.searchParams.set('page', params.page);
  if (params.limit) url.searchParams.set('limit', params.limit);
  if (params.tag) url.searchParams.set('tag', params.tag);
  if (params.search) url.searchParams.set('search', params.search);

  const res = await fetch(url.toString(), { next: { revalidate: 60 } });
  if (!res.ok) {
    throw new Error(`Failed to fetch posts: ${res.status} ${res.statusText}`);
  }
  const json: unknown = await res.json();
  // Prefer richer handler { success, data }
  if (json && typeof json === 'object' && 'success' in json) {
    const { success, data } = json as { success?: boolean; data?: BlogApiResponse };
    if (!success || !data || !Array.isArray(data.posts)) {
      throw new Error('Blog API responded with success=false or missing/invalid data');
    }
    return data;
  }
  // Fallback to legacy array-only response
  if (Array.isArray((json as any)?.posts)) {
    // Support backwards-compat top-level posts field
    const posts = (json as any).posts as Post[];
    const pagination = {
      page: 1,
      limit: posts.length,
      totalCount: posts.length,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
      nextPage: null,
      prevPage: null,
    };
    return { posts, pagination, filters: { tag: params.tag ?? null, search: params.search ?? null } };
  }
  throw new Error('Invalid posts payload');
}

export const metadata: Metadata = {
  title: "The Nomad's Chronicle – Blog",
  description: 'Stories, tips, and sustainability insights for digital nomads.',
};

export default async function BlogPage({ searchParams }: Readonly<{ searchParams?: { page?: string; limit?: string; tag?: string; search?: string } }>) {
  // Support Next 14 (sync) and Next 15 (async) searchParams
  const sp = await Promise.resolve((searchParams ?? {}) as any);
  const { page, limit, tag, search } = sp as { page?: string; limit?: string; tag?: string; search?: string };
  const { posts, pagination } = await getPosts({ page, limit, tag, search });

  const uniqueTags = Array.from(
    new Set(
      posts.flatMap((p: any) => Array.isArray(p.tags) ? (p.tags as string[]) : [])
    )
  ).slice(0, 20);

  return (
    <>
    <Header />
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-5xl font-extrabold text-center mb-6 text-gray-900">The Nomad's Chronicle</h1>

      {/* Filters */}
      <form className="mb-10 flex flex-col md:flex-row items-stretch md:items-center gap-3" action="/blog" method="get">
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
        <button className="px-6 py-3 bg-yellow-400 border-4 border-black rounded-lg font-bold">Apply</button>
      </form>

      {uniqueTags.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {uniqueTags.map((t) => {
            const sp = new URLSearchParams();
            if (t) sp.set('tag', t);
            if (search) sp.set('search', search);
            if (limit) sp.set('limit', limit);
            return (
              <Link key={t} href={`/blog?${sp.toString()}`} className={`px-3 py-1 border-2 border-black rounded-full text-sm ${t === tag ? 'bg-black text-white' : 'bg-white'}`}>
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
          const alt = usingPlaceholder ? '' : (post.title || '');
          return (
            <Link key={post.id} href={`/blog/${post.slug}`}>
              <div className="block bg-white border-4 border-black rounded-lg shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 ease-in-out overflow-hidden">
                <div className="relative h-48">
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
                <div className="p-6">
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
        <span className="text-sm text-gray-700">Page {pagination.page} of {pagination.totalPages}</span>
        {pagination.hasNextPage && (
          <Link
            href={`/blog?${new URLSearchParams({
              page: String(pagination.nextPage ?? (pagination.page + 1)),
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

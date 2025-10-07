
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
      posts
        .flatMap((p: Post) => (Array.isArray(p.tags) ? p.tags : []))
        .map((t) => (typeof t === 'string' ? t.trim() : ''))
        .filter((t): t is string => t.length > 0)
    )
  ).slice(0, 20);

  return (
    <>
    <Header />
    <div className="container mx-auto px-4 py-8">
      {/* Newspaper Masthead */}
      <div className="border-8 border-black bg-white mb-8 p-8">
        <div className="border-b-4 border-black pb-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold tracking-widest uppercase">Est. 2024</div>
            <div className="text-xs font-bold tracking-widest uppercase">Digital Nomad Edition</div>
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-center tracking-tight leading-none" style={{ fontFamily: 'serif' }}>
            The Nomad's Chronicle
          </h1>
          <div className="text-center text-sm font-bold mt-2 tracking-wider">
            SUSTAINABILITY • TRAVEL • REMOTE WORK
          </div>
        </div>
        <div className="flex justify-between items-center text-xs font-bold border-b-2 border-black pb-2">
          <div>VOL. {pagination.page}</div>
          <div className="text-center flex-1">ALL THE NEWS NOMADS NEED</div>
          <div>ISSUE #{pagination.page}</div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-yellow-300 border-4 border-black p-6 mb-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-2xl font-black mb-4 uppercase tracking-wide">Find Your Story</h2>
        <form className="flex flex-col md:flex-row items-stretch md:items-center gap-3" action="/blog" method="get">
          <input
            type="search"
            name="search"
            defaultValue={search || ''}
            placeholder="Search articles..."
            className="flex-1 p-3 bg-white border-4 border-black font-bold placeholder:text-gray-500"
          />
          <input
            type="text"
            name="tag"
            defaultValue={tag || ''}
            placeholder="Filter by topic..."
            className="w-full md:w-64 p-3 bg-white border-4 border-black font-bold placeholder:text-gray-500"
          />
          <button className="px-8 py-3 bg-white border-4 border-black font-black uppercase tracking-wide hover:bg-black hover:text-white transition-colors">
            Search
          </button>
          {limit ? <input type="hidden" name="limit" value={limit} /> : null}
        </form>
      </div>

      {uniqueTags.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {uniqueTags.map((t) => {
            const sp = new URLSearchParams();
            if (t) sp.set('tag', t);
            if (search) sp.set('search', search);
            if (limit) sp.set('limit', limit);
            return (
              <Link 
                key={t} 
                href={`/blog?${sp.toString()}`} 
                className={`px-4 py-2 border-3 border-black font-bold text-sm uppercase tracking-wide transition-all ${
                  t === tag 
                    ? 'bg-black text-white' 
                    : 'bg-white hover:bg-yellow-300'
                }`}
              >
                {t}
              </Link>
            );
          })}
        </div>
      )}

      {/* Featured Story (First Post) */}
      {posts.length > 0 && (
        <div className="mb-12">
          {(() => {
            const post = posts[0];
            const imageUrl = post.imageUrl ?? null;
            const usingPlaceholder = !imageUrl;
            const src = imageUrl ?? placeholderDataUri(1200, 600);
            const alt = usingPlaceholder ? '' : (post.title || '');
            return (
              <Link href={`/blog/${post.slug}`} className="block">
                <div className="bg-white border-8 border-black p-0 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] transition-all group">
                  <div className="relative h-96 border-b-8 border-black">
                    <Image
                      src={src}
                      alt={alt}
                      aria-hidden={usingPlaceholder}
                      fill
                      className="object-cover"
                      sizes="100vw"
                      priority
                    />
                    <div className="absolute top-4 left-4 bg-yellow-300 border-4 border-black px-4 py-2 font-black uppercase text-sm">
                      Featured Story
                    </div>
                  </div>
                  <div className="p-8">
                    <h2 className="text-5xl md:text-6xl font-black mb-4 leading-tight group-hover:underline" style={{ fontFamily: 'serif' }}>
                      {post.title}
                    </h2>
                    <p className="text-xl text-gray-700 leading-relaxed font-medium">
                      {post.excerpt}
                    </p>
                    <div className="mt-4 flex items-center gap-4 text-sm font-bold uppercase">
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex gap-2">
                          {post.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="bg-black text-white px-3 py-1 text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })()}
        </div>
      )}

      {/* News Grid - Remaining Posts */}
      {posts.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {posts.slice(1).map((post: Post, idx: number) => {
            const imageUrl = post.imageUrl ?? null;
            const usingPlaceholder = !imageUrl;
            const src = imageUrl ?? placeholderDataUri(800, 450);
            const alt = usingPlaceholder ? '' : (post.title || '');
            return (
              <Link key={post.id} href={`/blog/${post.slug}`} className="block group">
                <article className="bg-white border-6 border-black h-full flex flex-col shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all">
                  <div className="relative h-48 border-b-6 border-black flex-shrink-0">
                    <Image
                      src={src}
                      alt={alt}
                      aria-hidden={usingPlaceholder}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      priority={idx < 2}
                    />
                  </div>
                  <div className="p-6 flex-grow flex flex-col">
                    <h3 className="text-2xl md:text-3xl font-black mb-3 leading-tight group-hover:underline" style={{ fontFamily: 'serif' }}>
                      {post.title}
                    </h3>
                    <p className="text-gray-700 leading-relaxed flex-grow font-medium">
                      {post.excerpt}
                    </p>
                    {post.tags && post.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {post.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="bg-yellow-300 border-2 border-black px-2 py-1 text-xs font-bold uppercase">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination - Newspaper Style */}
      <div className="border-t-4 border-b-4 border-black py-6 flex items-center justify-between bg-white">
        <div className="flex-1">
          {pagination.hasPrevPage && (
            <Link
              href={`/blog?${new URLSearchParams({
                page: String(pagination.prevPage ?? 1),
                ...(tag ? { tag } : {}),
                ...(search ? { search } : {}),
                ...(limit ? { limit } : {}),
              }).toString()}`}
              className="inline-block px-6 py-3 bg-white border-4 border-black font-black uppercase text-sm hover:bg-black hover:text-white transition-colors"
            >
              ← Previous Issue
            </Link>
          )}
        </div>
        <div className="text-center flex-1">
          <span className="text-lg font-black uppercase tracking-wider">
            Issue {pagination.page} of {pagination.totalPages}
          </span>
        </div>
        <div className="flex-1 text-right">
          {pagination.hasNextPage && (
            <Link
              href={`/blog?${new URLSearchParams({
                page: String(pagination.nextPage ?? (pagination.page + 1)),
                ...(tag ? { tag } : {}),
                ...(search ? { search } : {}),
                ...(limit ? { limit } : {}),
              }).toString()}`}
              className="inline-block px-6 py-3 bg-white border-4 border-black font-black uppercase text-sm hover:bg-black hover:text-white transition-colors"
            >
              Next Issue →
            </Link>
          )}
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
}

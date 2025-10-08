
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

  const fallbackResponse: BlogApiResponse = {
    posts: [],
    pagination: {
      page: 1,
      limit: 0,
      totalCount: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
      nextPage: null,
      prevPage: null,
    },
    filters: { tag: params.tag ?? null, search: params.search ?? null },
  };

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 60 } });
    if (!res.ok) {
      console.error(`Failed to fetch posts: ${res.status} ${res.statusText}`);
      return fallbackResponse;
    }
    const json: unknown = await res.json();
  // Prefer richer handler { success, data }
  if (json && typeof json === 'object' && 'success' in json) {
    const { success, data } = json as { success?: boolean; data?: BlogApiResponse };
    if (!success || !data || !Array.isArray(data.posts)) {
      console.error('Blog API responded with success=false or missing/invalid data');
      return fallbackResponse;
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
    console.error('Invalid posts payload');
    return fallbackResponse;
  } catch (error) {
    console.error('Unable to reach blog API', error);
    return fallbackResponse;
  }
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

  const editionDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(new Date());
  const [leadPost, ...otherPosts] = posts;

  return (
    <>
      <Header />
      <main className="bg-[#f8f2e4] text-gray-900">
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="border border-black bg-[#fefcf6] shadow-[12px_12px_0_rgba(0,0,0,0.05)]">
            <header className="border-b border-black px-6 py-10 text-center">
              <p className="text-xs uppercase tracking-[0.35em] text-gray-500">{editionDate}</p>
              <h1 className="mt-4 font-serif text-4xl font-black uppercase md:text-6xl">The Nomad's Chronicle</h1>
              <p className="mt-3 text-sm italic text-gray-600">Sustainable dispatches for the eco-conscious drifter</p>
            </header>

            <div className="border-b border-black bg-[#f8f2e4]/60 px-6 py-6">
              <form className="grid gap-4 md:grid-cols-[2fr,1.5fr,auto] md:items-end" action="/blog" method="get">
                <label className="flex flex-col gap-2 text-xs font-semibold tracking-[0.25em] text-gray-600">
                  Search
                  <input
                    type="search"
                    name="search"
                    defaultValue={search || ''}
                    placeholder="Find a story..."
                    className="w-full border border-black/70 bg-[#fffdf7] px-4 py-2 text-sm font-serif uppercase tracking-widest text-gray-800 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/60"
                  />
                </label>
                <label className="flex flex-col gap-2 text-xs font-semibold tracking-[0.25em] text-gray-600">
                  Tag
                  <input
                    type="text"
                    name="tag"
                    defaultValue={tag || ''}
                    placeholder="Eco, Remote Work..."
                    className="w-full border border-black/70 bg-[#fffdf7] px-4 py-2 text-sm font-serif uppercase tracking-widest text-gray-800 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/60"
                  />
                </label>
                <div className="flex gap-3">
                  <button className="inline-flex items-center justify-center border border-black bg-black px-6 py-3 font-serif text-sm font-semibold uppercase tracking-[0.35em] text-[#fefcf6] shadow-[4px_4px_0_rgba(0,0,0,0.1)] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_rgba(0,0,0,0.12)]">
                    Apply
                  </button>
                  {limit ? <input type="hidden" name="limit" value={limit} /> : null}
                </div>
              </form>

              {uniqueTags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-3">
                  {uniqueTags.map((t) => {
                    const sp = new URLSearchParams();
                    if (t) sp.set('tag', t);
                    if (search) sp.set('search', search);
                    if (limit) sp.set('limit', limit);
                    const isActive = t === tag;
                    return (
                      <Link
                        key={t}
                        href={`/blog?${sp.toString()}`}
                        className={`border border-black/70 px-3 py-1 font-serif text-xs uppercase tracking-[0.35em] transition ${
                          isActive
                            ? 'bg-black text-[#fefcf6] shadow-[3px_3px_0_rgba(0,0,0,0.12)]'
                            : 'bg-[#fffdf7] text-gray-700 hover:bg-black hover:text-[#fefcf6]'
                        }`}
                      >
                        #{t}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {leadPost && (
              <Link href={`/blog/${leadPost.slug}`} className="block border-b border-black transition hover:bg-[#f8f2e4]/50">
                <article className="grid gap-8 px-6 py-10 font-serif md:grid-cols-[3fr,2fr]">
                  <div className="relative overflow-hidden border border-black/80 bg-[#f8f2e4] shadow-[6px_6px_0_rgba(0,0,0,0.08)]">
                    <div className="relative aspect-[3/2]">
                      <Image
                        src={leadPost.imageUrl ?? placeholderDataUri(960, 640)}
                        alt={leadPost.imageUrl ? leadPost.title : ''}
                        aria-hidden={!leadPost.imageUrl}
                        fill
                        className="object-cover grayscale-[20%]"
                        sizes="(min-width: 1280px) 50vw, (min-width: 768px) 60vw, 100vw"
                        priority
                      />
                    </div>
                  </div>
                  <div className="flex flex-col justify-between">
                    <header>
                      <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Front Page Feature</p>
                      <h2 className="mt-4 text-3xl font-black leading-tight md:text-5xl">{leadPost.title}</h2>
                    </header>
                    <p className="mt-6 text-base leading-relaxed text-gray-700 md:text-lg">
                      {leadPost.excerpt || 'Explore the latest dispatch from our global correspondents.'}
                    </p>
                    <p className="mt-6 text-xs uppercase tracking-[0.35em] text-gray-600">Continue reading →</p>
                  </div>
                </article>
              </Link>
            )}

            {otherPosts.length > 0 && (
              <div className="grid border-b border-black md:grid-cols-2 xl:grid-cols-3">
                {otherPosts.map((post: Post, idx: number) => {
                  const imageUrl = post.imageUrl ?? null;
                  const usingPlaceholder = !imageUrl;
                  const src = imageUrl ?? placeholderDataUri(640, 480);
                  const alt = usingPlaceholder ? '' : post.title || '';
                  return (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      className="group border-t border-black/60 px-6 py-8 transition hover:bg-[#f8f2e4]/50 first:border-t-0 md:border-l md:[&:nth-child(3n+1)]:border-l-0"
                    >
                      <article className="flex h-full flex-col gap-4 font-serif">
                        <div className="relative overflow-hidden border border-black/50 bg-[#fdf7ea]/70 shadow-[4px_4px_0_rgba(0,0,0,0.06)]">
                          <div className="relative aspect-[4/3]">
                            <Image
                              src={src}
                              alt={alt}
                              aria-hidden={usingPlaceholder}
                              fill
                              className="object-cover grayscale group-hover:grayscale-0"
                              sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
                              priority={idx < 2}
                            />
                          </div>
                        </div>
                        <div className="flex flex-1 flex-col">
                          <h3 className="text-2xl font-bold leading-tight">{post.title}</h3>
                          <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-700">
                            {post.excerpt || 'Read the latest insights on sustainable nomad living from our newsroom.'}
                          </p>
                          <span className="mt-6 text-[10px] font-semibold uppercase tracking-[0.45em] text-gray-500">
                            Read more
                          </span>
                        </div>
                      </article>
                    </Link>
                  );
                })}
              </div>
            )}

            {!leadPost && otherPosts.length === 0 && (
              <div className="border-b border-black bg-[#fffdf7] px-6 py-16 text-center font-serif text-lg uppercase tracking-[0.35em] text-gray-500">
                No dispatches available yet — check back soon for fresh chronicles.
              </div>
            )}

            <div className="px-6 py-8">
              <div className="flex flex-col items-center gap-4 text-sm font-serif uppercase tracking-[0.35em] text-gray-700 md:flex-row md:justify-center">
                {pagination.hasPrevPage && (
                  <Link
                    href={`/blog?${new URLSearchParams({
                      page: String(pagination.prevPage ?? 1),
                      ...(tag ? { tag } : {}),
                      ...(search ? { search } : {}),
                      ...(limit ? { limit } : {}),
                    }).toString()}`}
                    className="border border-black bg-[#fffdf7] px-4 py-2 tracking-[0.35em] transition hover:bg-black hover:text-[#fefcf6]"
                  >
                    ← Previous Edition
                  </Link>
                )}
                <span className="text-[11px] tracking-[0.4em] text-gray-500">
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
                    className="border border-black bg-[#fffdf7] px-4 py-2 tracking-[0.35em] transition hover:bg-black hover:text-[#fefcf6]"
                  >
                    Next Edition →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

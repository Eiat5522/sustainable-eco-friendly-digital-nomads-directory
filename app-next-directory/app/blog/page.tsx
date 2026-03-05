import Image from 'next/image';
import Link from 'next/link';

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
import { PageLayoutServer } from '@/components/layout/PageLayoutServer';
import { NeoButton } from '@/components/ui/neo-button';
import { getBaseUrl } from '@/lib/absolute-url';
import { getSafeHeaders } from '@/lib/server/headers';
import type { Post } from './data';
import { getPostsCached } from './data';

// Use cached server helper to avoid uncached fetches during prerender

export const metadata: Metadata = {
  title: "The Nomad's Chronicle – Blog",
  description: 'Stories, tips, and sustainability insights for digital nomads.',
};

export default async function BlogPage(
  props: Readonly<{
    searchParams?: Promise<{ page?: string; limit?: string; tag?: string; search?: string }>;
  }>
) {
  const { page = '1', limit = '10', tag = '', search = '' } = (await props.searchParams) || {};
  const searchParamsForPosts = { page, limit, tag, search };

  // Resolve request headers outside cached scopes.
  const requestHeaders = await getSafeHeaders();
  const baseUrl = await getBaseUrl(requestHeaders);

  // Fetch posts directly in the page component so errors propagate
  const result = await getPostsCached({ ...searchParamsForPosts, baseUrl });
  const { posts, pagination, uniqueTags } = result;

  return (
    <PageLayoutServer>
      <div className="relative overflow-hidden bg-neo-secondary px-4 py-12 sm:py-14">
        {/* Dot grid background */}
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-25"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, var(--neo-border) 2px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Decorative shapes */}
        <div className="pointer-events-none absolute -left-3 top-8 h-20 w-20 rotate-12 border-4 border-neo-border bg-neo-primary shadow-[6px_6px_0_0] shadow-neo-shadow" />
        <div className="pointer-events-none absolute right-4 top-12 h-16 w-16 rounded-full border-4 border-neo-border bg-neo-accent shadow-[5px_5px_0_0] shadow-neo-shadow" />

        <div className="container relative z-10 mx-auto max-w-6xl">
          {/* Page header card */}
          <div
            className="mb-8 overflow-hidden border-4 border-neo-border bg-neo-surface"
            style={{ boxShadow: '12px 12px 0px 0px var(--neo-shadow)' }}
          >
            <div className="border-b-4 border-neo-border bg-neo-success p-6 md:p-8">
              <div className="mb-3 inline-block border-2 border-neo-border bg-neo-surface px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] shadow-[3px_3px_0_0] shadow-neo-shadow">
                Stories &amp; Insights
              </div>
              <h1 className="heading-xl text-neo-border">The Nomad&apos;s Chronicle</h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold text-neo-border/80">
                Stories, tips, and sustainability insights for digital nomads.
              </p>
            </div>

            {/* Filters */}
            <div className="p-6 md:p-8">
              <form
                className="flex flex-col md:flex-row items-stretch md:items-center gap-3"
                action="/blog"
                method="get"
              >
                <input
                  type="search"
                  name="search"
                  defaultValue={search || ''}
                  placeholder="Search posts..."
                  className="flex-1 p-3 bg-neo-surface border-4 border-neo-border font-medium text-neo-text-primary placeholder:text-neo-text-secondary shadow-[3px_3px_0_0] shadow-neo-shadow focus:outline-none focus:shadow-none focus:translate-x-[3px] focus:translate-y-[3px] transition-all"
                />
                <input
                  type="text"
                  name="tag"
                  defaultValue={tag || ''}
                  placeholder="Tag (e.g. eco, remote-work)"
                  className="w-full md:w-64 p-3 bg-neo-surface border-4 border-neo-border font-medium text-neo-text-primary placeholder:text-neo-text-secondary shadow-[3px_3px_0_0] shadow-neo-shadow focus:outline-none focus:shadow-none focus:translate-x-[3px] focus:translate-y-[3px] transition-all"
                />
                <NeoButton type="submit" variant="primary" size="md">
                  Apply
                </NeoButton>
                {limit ? <input type="hidden" name="limit" value={limit} /> : null}
              </form>

              {uniqueTags.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {uniqueTags.map(t => {
                    const sp = new URLSearchParams();
                    if (t) sp.set('tag', t);
                    if (search) sp.set('search', search);
                    if (limit) sp.set('limit', limit);
                    return (
                      <Link
                        key={t}
                        href={`/blog?${sp.toString()}`}
                        className={`px-3 py-1 border-2 border-neo-border text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0_0] shadow-neo-shadow transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none ${t === tag ? 'bg-neo-primary text-white' : 'bg-neo-surface text-neo-text-primary'}`}
                      >
                        #{t}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Posts grid */}
          {posts.length === 0 ? (
            <div
              className="border-4 border-neo-border bg-neo-surface p-12 text-center"
              style={{ boxShadow: '8px 8px 0px 0px var(--neo-shadow)' }}
            >
              <p className="body-lg text-neo-text-secondary">No posts found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post: Post, idx: number) => {
                const imageUrl = post.imageUrl ?? null;
                const usingPlaceholder = !imageUrl;
                const src = imageUrl ?? placeholderDataUri(800, 450);
                const alt = usingPlaceholder ? '' : post.title || '';
                return (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="group flex">
                    <article
                      className="flex flex-col w-full bg-neo-surface border-4 border-neo-border overflow-hidden transition-all group-hover:translate-x-[3px] group-hover:translate-y-[3px] group-hover:shadow-none"
                      style={{ boxShadow: '8px 8px 0px 0px var(--neo-shadow)' }}
                    >
                      <div className="relative h-48 flex-shrink-0 border-b-4 border-neo-border overflow-hidden">
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
                      <div className="p-5 flex-grow flex flex-col">
                        <h2 className="heading-sm mb-2 text-neo-text-primary">{post.title}</h2>
                        <p className="body-sm text-neo-text-secondary flex-grow">{post.excerpt}</p>
                        {post.tags && post.tags.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {[...new Set(post.tags)].map(tagName => (
                              <span
                                key={tagName}
                                className="px-2 py-0.5 border-2 border-neo-border text-[10px] font-bold uppercase tracking-wider bg-neo-secondary/30 text-neo-text-primary"
                              >
                                #{tagName}
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

          {/* Pagination */}
          <div className="mt-10 flex items-center justify-center gap-3">
            {pagination.hasPrevPage && (
              <NeoButton asChild variant="outline" size="sm">
                <Link
                  href={`/blog?${new URLSearchParams({
                    page: String(pagination.prevPage ?? 1),
                    ...(tag ? { tag } : {}),
                    ...(search ? { search } : {}),
                    ...(limit ? { limit } : {}),
                  }).toString()}`}
                >
                  ← Previous
                </Link>
              </NeoButton>
            )}
            <span className="body-sm font-bold text-neo-text-primary border-2 border-neo-border bg-neo-surface px-3 py-1">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            {pagination.hasNextPage && (
              <NeoButton asChild variant="outline" size="sm">
                <Link
                  href={`/blog?${new URLSearchParams({
                    page: String(pagination.nextPage ?? pagination.page + 1),
                    ...(tag ? { tag } : {}),
                    ...(search ? { search } : {}),
                    ...(limit ? { limit } : {}),
                  }).toString()}`}
                >
                  Next →
                </Link>
              </NeoButton>
            )}
          </div>
        </div>
      </div>
    </PageLayoutServer>
  );
}

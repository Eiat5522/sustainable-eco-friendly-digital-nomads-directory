import Image from 'next/image';
import Link from 'next/link';
import { NeoButton } from '@/components/ui/neo-button';
import { getBaseUrl } from '@/lib/absolute-url';
import { getSafeHeaders } from '@/lib/server/headers';
import { getPostsCached } from './data';

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

type SearchParams = {
  page?: string;
  limit?: string;
  tag?: string;
  search?: string;
};

type BlogPostsListProps = {
  searchParams: SearchParams;
};

export async function BlogPostsList({ searchParams }: Readonly<BlogPostsListProps>) {
  const { page, limit, tag, search } = searchParams;
  const requestHeaders = await getSafeHeaders();
  const baseUrl = await getBaseUrl(requestHeaders);
  const { posts, pagination, uniqueTags } = await getPostsCached({
    baseUrl,
    page,
    limit,
    tag,
    search,
  });

  return (
    <div className="relative overflow-hidden bg-neo-secondary px-4 py-12 sm:py-14">
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-25"
        style={{
          backgroundImage:
            'radial-gradient(circle at 2px 2px, var(--neo-border) 2px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="pointer-events-none absolute -left-6 top-8 h-24 w-24 rotate-12 border-4 border-neo-border bg-neo-primary shadow-[7px_7px_0_0] shadow-neo-shadow" />
      <div className="pointer-events-none absolute right-8 top-16 h-20 w-20 rounded-full border-4 border-neo-border bg-neo-accent shadow-[6px_6px_0_0] shadow-neo-shadow" />

      <div className="container relative z-10 mx-auto max-w-6xl">
        <section
          className="mb-8 border-4 border-neo-border bg-neo-surface p-6 md:p-8"
          style={{ boxShadow: '12px 12px 0px 0px var(--neo-shadow)' }}
        >
          <div className="mb-4 inline-block border-2 border-neo-border bg-neo-success px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] shadow-[3px_3px_0_0] shadow-neo-shadow">
            The Nomad&apos;s Chronicle
          </div>
          <h1 className="heading-xl text-neo-border">Stories for Sustainable Nomads</h1>
          <p className="mt-2 max-w-3xl text-sm font-semibold text-neo-text-secondary">
            Insights, city guides, and practical sustainability lessons from the remote-work road.
          </p>

          <form
            className="mt-6 grid gap-3 md:grid-cols-[1fr_16rem_auto]"
            action="/blog"
            method="get"
          >
            <input
              type="search"
              name="search"
              defaultValue={search || ''}
              placeholder="Search posts..."
              className="neo-input"
            />
            <input
              type="text"
              name="tag"
              defaultValue={tag || ''}
              placeholder="Filter by tag"
              className="neo-input"
            />
            <NeoButton type="submit" variant="primary" size="md">
              Apply
            </NeoButton>
            {limit ? <input type="hidden" name="limit" value={limit} /> : null}
          </form>

          {uniqueTags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {uniqueTags.map(currentTag => {
                const query = new URLSearchParams();
                if (currentTag) query.set('tag', currentTag);
                if (search) query.set('search', search);
                if (limit) query.set('limit', limit);

                return (
                  <Link
                    key={currentTag}
                    href={`/blog?${query.toString()}`}
                    className={`inline-flex items-center border-2 border-neo-border px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] transition-colors ${currentTag === tag ? 'bg-neo-border text-neo-surface' : 'bg-neo-surface text-neo-border hover:bg-neo-primary hover:text-white'}`}
                  >
                    #{currentTag}
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section
          className="border-4 border-neo-border bg-neo-surface p-6 md:p-8"
          style={{ boxShadow: '12px 12px 0px 0px var(--neo-shadow)' }}
        >
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="heading-lg">Latest Posts</h2>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-neo-text-secondary">
              Page {pagination.page} of {pagination.totalPages}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => {
              const imageUrl = post.imageUrl ?? null;
              const usingPlaceholder = !imageUrl;
              const src = imageUrl ?? placeholderDataUri(800, 450);
              const alt = usingPlaceholder ? '' : post.title || '';

              return (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group block border-4 border-neo-border bg-neo-surface transition-transform hover:-translate-y-1"
                  style={{ boxShadow: '8px 8px 0px 0px var(--neo-shadow)' }}
                >
                  <div className="relative h-44 overflow-hidden border-b-4 border-neo-border bg-neo-secondary/25">
                    <Image
                      src={src}
                      alt={alt}
                      aria-hidden={usingPlaceholder}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      priority={index < 3}
                    />
                  </div>

                  <div className="p-5">
                    <h3 className="line-clamp-2 text-xl font-black uppercase tracking-tight text-neo-border">
                      {post.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm font-medium text-neo-text-secondary">
                      {post.excerpt}
                    </p>
                    {post.tags && post.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {[...new Set(post.tags)].slice(0, 3).map(tagName => (
                          <span
                            key={tagName}
                            className="border border-neo-border bg-neo-secondary/35 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                          >
                            #{tagName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-8 flex items-center justify-center gap-3">
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
                  Prev
                </Link>
              </NeoButton>
            )}

            <span className="text-xs font-bold uppercase tracking-[0.16em] text-neo-text-secondary">
              {pagination.page} / {pagination.totalPages}
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
                  Next
                </Link>
              </NeoButton>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

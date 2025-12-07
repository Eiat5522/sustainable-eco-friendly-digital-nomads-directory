'use cache';
// Cached server helper for the blog index page. Export only async functions
// from a `use cache` module to be Turbopack-friendly.

import { getBaseUrl } from '@/lib/absolute-url';
import type { HeadersLike } from '@/types/request';

export async function getPostsCached(params: {
  page?: string;
  limit?: string;
  tag?: string;
  search?: string;
  headersParam?: HeadersLike | null; // FORTEST: Accept headers to avoid implicit headers() in cache
}) {
  const CACHE_LIFE_SECONDS = 60;
  const base = await getBaseUrl(params.headersParam);
  const url = new URL('/api/blog', base);
  if (params.page) url.searchParams.set('page', params.page);
  if (params.limit) url.searchParams.set('limit', params.limit);
  if (params.tag) url.searchParams.set('tag', params.tag);
  if (params.search) url.searchParams.set('search', params.search);

  const res = await fetch(url.toString(), { next: { revalidate: CACHE_LIFE_SECONDS } });
  if (!res.ok) {
    throw new Error(`Failed to fetch posts: ${res.status} ${res.statusText}`);
  }
  const json: unknown = await res.json();
  if (json && typeof json === 'object' && 'success' in json) {
    const { data } = json as { data?: any };
    if (!data || !Array.isArray(data.posts)) {
      throw new Error('Blog API responded with missing/invalid data');
    }
    return data;
  }
  if (Array.isArray((json as { posts?: unknown })?.posts)) {
    const posts = (json as { posts: any[] }).posts;
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
    return {
      posts,
      pagination,
      filters: { tag: params.tag ?? null, search: params.search ?? null },
    };
  }
  throw new Error('Invalid posts payload');
}

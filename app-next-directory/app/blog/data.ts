'use cache';
// Cached server helper for the blog index page. Export only async functions
// from a `use cache` module to be Turbopack-friendly.

import { getBaseUrl } from '@/lib/absolute-url';

export async function getPostsCached(params: {
  page?: string;
  limit?: string;
  tag?: string;
  search?: string;
}) {
  const CACHE_LIFE_SECONDS = 60;
  // Use getBaseUrl to allow for testing and proper URL construction
  const base = await getBaseUrl();
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
    const response = json as {
      success?: boolean;
      data?: { posts: unknown[]; pagination: unknown; uniqueTags: string[] };
    };
    if (response.success === false) {
      throw new Error('Blog API responded with success=false or missing/invalid data');
    }
    const { data } = response;
    if (!data || !Array.isArray(data.posts)) {
      throw new Error('Blog API responded with success=false or missing/invalid data');
    }
    const { posts, pagination, uniqueTags = [] } = data;
    return { posts, pagination, uniqueTags };
  }
  if (Array.isArray((json as { posts?: unknown })?.posts)) {
    const response = json as { posts: unknown[] };
    const posts = response.posts;
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
    // Extract unique tags from posts for legacy responses
    const allTags: string[] = [];
    for (const post of posts) {
      if (post && typeof post === 'object' && 'tags' in post) {
        const tags = (post as { tags?: string[] }).tags;
        if (Array.isArray(tags)) {
          allTags.push(...tags);
        }
      }
    }
    const uniqueTags = [...new Set(allTags)];
    return {
      posts,
      pagination,
      uniqueTags,
    };
  }
  throw new Error('Invalid posts payload');
}

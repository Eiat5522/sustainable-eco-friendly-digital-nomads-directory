'use cache';
// Cached server helper for the blog index page. Export only async functions
// from a `use cache` module to be Turbopack-friendly.

type BlogPagination = {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
};

export type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  tags?: string[];
  imageUrl?: string | null;
};

type BlogPostsResponse = {
  posts: Post[];
  pagination: BlogPagination;
  uniqueTags: string[];
};

type RecordValue = Record<string, unknown>;

const isRecord = (value: unknown): value is RecordValue =>
  typeof value === 'object' && value !== null;

const isString = (value: unknown): value is string => typeof value === 'string';

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isNullableString = (value: unknown): value is string | null =>
  value === null || isString(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isString);

const isPost = (value: unknown): value is Post => {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isString(value.title) &&
    isString(value.slug) &&
    (value.excerpt === undefined || isNullableString(value.excerpt)) &&
    (value.tags === undefined || isStringArray(value.tags)) &&
    (value.imageUrl === undefined || isNullableString(value.imageUrl))
  );
};

const isPagination = (value: unknown): value is BlogPagination => {
  if (!isRecord(value)) return false;
  return (
    isNumber(value.page) &&
    isNumber(value.limit) &&
    isNumber(value.totalCount) &&
    isNumber(value.totalPages) &&
    typeof value.hasNextPage === 'boolean' &&
    typeof value.hasPrevPage === 'boolean' &&
    (value.nextPage === null || isNumber(value.nextPage)) &&
    (value.prevPage === null || isNumber(value.prevPage))
  );
};

export async function getPostsCached(params: {
  baseUrl: string;
  page?: string;
  limit?: string;
  tag?: string;
  search?: string;
}): Promise<BlogPostsResponse> {
  const CACHE_LIFE_SECONDS = 60;
  const base = params.baseUrl;
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
  if (isRecord(json) && 'success' in json) {
    if (json.success === false) {
      throw new Error('Blog API responded with success=false');
    }
    const data = json.data;
    if (!isRecord(data)) {
      throw new Error('Blog API returned missing or invalid data object');
    }
    const postsRaw = data.posts;
    const paginationRaw = data.pagination;
    const uniqueTagsRaw = data.uniqueTags ?? [];
    if (!Array.isArray(postsRaw) || !postsRaw.every(isPost)) {
      throw new Error('Blog API returned invalid posts payload');
    }
    if (!isPagination(paginationRaw)) {
      throw new Error('Blog API returned invalid pagination payload');
    }
    if (!isStringArray(uniqueTagsRaw)) {
      throw new Error('Blog API returned invalid uniqueTags payload');
    }
    const posts = postsRaw;
    const pagination = paginationRaw;
    const uniqueTags = uniqueTagsRaw;
    return { posts, pagination, uniqueTags };
  }
  if (isRecord(json) && Array.isArray(json.posts)) {
    const postsRaw = json.posts;
    if (!postsRaw.every(isPost)) {
      throw new Error('Blog API returned invalid posts payload');
    }
    const posts = postsRaw;
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
      if (post.tags) allTags.push(...post.tags);
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

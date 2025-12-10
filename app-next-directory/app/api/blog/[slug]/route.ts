import type { NextRequest } from 'next/server';
import { groq } from 'next-sanity';
import { transformToBlogDetailDTO } from '@/lib/dto-transformer';
import structuredLogger from '@/lib/logger';
import { client as sanityClient } from '@/lib/sanity/client';
import { incrementViewCount as persistentIncrementViewCount } from '@/lib/viewCountPersistence';
import { ApiResponseHandler } from '@/utils/api-response';

type FetchFn = (query: string, params?: Record<string, unknown>) => Promise<unknown>;
type TransformFn = typeof transformToBlogDetailDTO;

type RawSanityBlogPost = {
  _id: string;
  _updatedAt?: string;
} & Record<string, unknown>;

/**
 * Type guard to check if a value is a valid Sanity blog post
 */
function isSanityBlogPost(value: unknown): value is RawSanityBlogPost {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_id' in value &&
    typeof (value as RawSanityBlogPost)._id === 'string'
  );
}

type FallbackCacheEntry = {
  count: number;
  lastAccessed: number;
};

const FALLBACK_CACHE_SHARDS = 4;
const FALLBACK_CACHE_MAX_SIZE = 500;
const FALLBACK_CACHE_REPORT_INTERVAL_MS = 60_000;
const FALLBACK_CACHE_ESTIMATE_PER_ENTRY_BYTES = 128;

const fallbackCacheShards: Array<Map<string, FallbackCacheEntry>> = Array.from(
  { length: FALLBACK_CACHE_SHARDS },
  () => new Map<string, FallbackCacheEntry>()
);
const fallbackAccessQueue: string[] = [];

type FallbackMetricsState = {
  totalFallbacks: number;
  cacheHits: number;
  cacheMisses: number;
  evictions: number;
  peakSize: number;
  lastReportedAt: number;
};

const fallbackMetrics: FallbackMetricsState = {
  totalFallbacks: 0,
  cacheHits: 0,
  cacheMisses: 0,
  evictions: 0,
  peakSize: 0,
  lastReportedAt: 0,
};

const getFallbackShardIndex = (postId: string): number => {
  let hash = 0;
  for (let index = 0; index < postId.length; index += 1) {
    hash = (hash * 31 + postId.charCodeAt(index)) >>> 0;
  }
  return hash % FALLBACK_CACHE_SHARDS;
};

const getFallbackShard = (postId: string): Map<string, FallbackCacheEntry> => {
  const shard = fallbackCacheShards[getFallbackShardIndex(postId)];
  if (!shard) {
    // This should be logically impossible given the modulo arithmetic,
    // but it satisfies the compiler and guards against future bugs.
    throw new Error(`Could not find fallback cache shard for post ID: ${postId}`);
  }
  return shard;
};

const getFallbackCacheSize = (): number => {
  return fallbackCacheShards.reduce((size, shard) => size + shard.size, 0);
};

const maybeReportFallbackStats = (currentSize: number) => {
  const now = Date.now();
  if (now - fallbackMetrics.lastReportedAt < FALLBACK_CACHE_REPORT_INTERVAL_MS) {
    return;
  }

  fallbackMetrics.lastReportedAt = now;
  structuredLogger.info('Blog view count fallback cache metrics', {
    component: 'blog-view-count-fallback',
    totalFallbacks: fallbackMetrics.totalFallbacks,
    cacheHits: fallbackMetrics.cacheHits,
    cacheMisses: fallbackMetrics.cacheMisses,
    currentSize,
    peakSize: fallbackMetrics.peakSize,
    evictions: fallbackMetrics.evictions,
    approxMemoryBytes: currentSize * FALLBACK_CACHE_ESTIMATE_PER_ENTRY_BYTES,
  });
};

const pruneFallbackCache = (currentSize: number): number => {
  let size = currentSize;
  let evicted = 0;

  while (size > FALLBACK_CACHE_MAX_SIZE) {
    const candidate = fallbackAccessQueue.shift();
    if (candidate === undefined) {
      break;
    }

    const shard = getFallbackShard(candidate);
    if (shard.delete(candidate)) {
      size -= 1;
      evicted += 1;
      fallbackMetrics.evictions += 1;
    }
  }

  if (evicted > 0) {
    structuredLogger.warn('Blog view count fallback cache eviction', {
      component: 'blog-view-count-fallback',
      evicted,
      remaining: size,
      maxSize: FALLBACK_CACHE_MAX_SIZE,
    });
  }

  return size;
};

const recordFallbackView = (postId: string): number => {
  const shard = getFallbackShard(postId);
  const existing = shard.get(postId);
  const newCount = (existing?.count ?? 0) + 1;
  const now = Date.now();

  shard.set(postId, { count: newCount, lastAccessed: now });
  fallbackAccessQueue.push(postId);

  fallbackMetrics.totalFallbacks += 1;
  if (existing) {
    fallbackMetrics.cacheHits += 1;
  } else {
    fallbackMetrics.cacheMisses += 1;
  }

  let currentSize = getFallbackCacheSize();
  currentSize = pruneFallbackCache(currentSize);
  fallbackMetrics.peakSize = Math.max(fallbackMetrics.peakSize, currentSize);
  maybeReportFallbackStats(currentSize);

  return newCount;
};

const resetFallbackCache = () => {
  for (const shard of fallbackCacheShards) {
    shard.clear();
  }
  fallbackAccessQueue.length = 0;
  fallbackMetrics.totalFallbacks = 0;
  fallbackMetrics.cacheHits = 0;
  fallbackMetrics.cacheMisses = 0;
  fallbackMetrics.evictions = 0;
  fallbackMetrics.peakSize = 0;
  fallbackMetrics.lastReportedAt = 0;
};

const getFallbackMetricsSnapshot = () => ({
  totalFallbacks: fallbackMetrics.totalFallbacks,
  cacheHits: fallbackMetrics.cacheHits,
  cacheMisses: fallbackMetrics.cacheMisses,
  evictions: fallbackMetrics.evictions,
  peakSize: fallbackMetrics.peakSize,
  currentSize: getFallbackCacheSize(),
  maxSize: FALLBACK_CACHE_MAX_SIZE,
});

const isTestEnv = process.env.NODE_ENV === 'test';

type TestControl = {
  sanityFetchOverride: FetchFn | undefined;
  transformOverride: TransformFn | undefined;
  trackViewCountOverride: ((postId: string) => Promise<number>) | undefined;
  resetViewCounts: () => void;
  resetFallbackMetrics: () => void;
  getFallbackMetrics: () => ReturnType<typeof getFallbackMetricsSnapshot>;
};

const _testControl: TestControl | undefined = isTestEnv
  ? {
      sanityFetchOverride: undefined,
      transformOverride: undefined,
      trackViewCountOverride: undefined,
      resetViewCounts: () => {
        resetFallbackCache();
      },
      resetFallbackMetrics: () => {
        resetFallbackCache();
      },
      getFallbackMetrics: () => getFallbackMetricsSnapshot(),
    }
  : undefined;

if (process.env.NODE_ENV === 'test') {
  (module.exports as Record<string, unknown>)._testControl = _testControl;
}

// GROQ query for fetching a single blog post by slug
const postQuery = groq`
  *[_type == "blogPost" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    // Include full image object with dereferenced asset for URL + metadata
    "primaryImage": primaryImage{ ..., asset-> },
    publishedAt,
    excerpt,
    body,
    tags,
    "authorName": author->name,
    "authorImage": author->image,
    "authorBio": author->bio,
    "readingTime": round(length(pt::text(body)) / 200),
    "relatedPosts": *[_type == "blogPost" && slug.current != $slug && count(tags[@ in ^.tags]) > 0] | order(publishedAt desc) [0...3] {
      "slug": slug.current,
      _id,
      title,
      // Ensure related posts also expose image URLs
      "primaryImage": primaryImage{ ..., asset-> },
      publishedAt,
      excerpt,
      "authorName": author->name
    },
    _createdAt,
    _updatedAt
  }
`;

// GET endpoint for fetching a single blog post
export async function GET(_request: NextRequest, props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  try {
    structuredLogger.debug('GET /api/blog/[slug] called', { slug });

    if (!slug) {
      structuredLogger.warn('GET /api/blog/[slug] - slug is missing', { slug });
      return ApiResponseHandler.error('Blog post slug is required', 400);
    }

    // Fetch the blog post
    structuredLogger.debug('Fetching post from Sanity', { slug, query: postQuery });
    const fetchFn =
      _testControl?.sanityFetchOverride ??
      ((query: string, params?: Record<string, unknown>) => sanityClient.fetch(query, params));
    const post = (await fetchFn(postQuery, { slug })) as RawSanityBlogPost | null;
    structuredLogger.debug('Received response from Sanity', {
      slug,
      post: post ? 'found' : 'not found',
    });

    if (!isSanityBlogPost(post)) {
      if (!post) {
        structuredLogger.info('Blog post not found', { slug });
        return ApiResponseHandler.notFound('Blog post');
      }
      structuredLogger.warn('Invalid Sanity blog post format received', { slug, post });
      return ApiResponseHandler.notFound('Blog post');
    }

    structuredLogger.debug('Transforming post to DTO', { slug });
    const transform = _testControl?.transformOverride ?? transformToBlogDetailDTO;
    const dto = transform(post);
    structuredLogger.debug('Post transformed to DTO', {
      slug,
      dto: JSON.stringify(dto),
    });

    // Ensure related posts in DTO format if present
    const response = {
      post: dto,
      relatedPosts: Array.isArray(dto.relatedPosts) ? dto.relatedPosts : [],
      meta: {
        readingTime: dto.readingTime ?? null,
        publishedDate: dto.publishedAt ?? null,
        lastModified: typeof post._updatedAt === 'string' ? post._updatedAt : null,
        wordCount: Array.isArray(dto.body) ? dto.body.length : 0,
      },
    };

    // Return a single canonical payload shape
    structuredLogger.info('Successfully fetched and transformed blog post', { slug });
    return ApiResponseHandler.success(response);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('fetch failed')) {
        return ApiResponseHandler.error('Failed to connect to CMS. Please try again later.', 503);
      }
      if (error.message.includes('Invalid parameter')) {
        return ApiResponseHandler.error('Invalid blog post slug', 400);
      }
    }

    return ApiResponseHandler.error('Failed to fetch blog post', 500);
  }
}

// View count tracking with MongoDB persistence
async function trackViewCount(postId: string): Promise<number> {
  if (_testControl?.trackViewCountOverride) {
    return _testControl?.trackViewCountOverride(postId);
  }

  try {
    // Use persistent storage in production
    return await persistentIncrementViewCount(postId);
  } catch (error) {
    structuredLogger.error('Blog view count persistence failed', error, {
      component: 'blog-view-count-fallback',
      postId,
    });
    return recordFallbackView(postId);
  }
}

// PUT endpoint for updating view count (optional)
export async function PUT(request: NextRequest, props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  try {
    const body = await request.json();

    if (body.action === 'increment_view') {
      // Find post ID by slug
      const fetchFn =
        _testControl?.sanityFetchOverride ??
        ((query: string, params?: Record<string, unknown>) => sanityClient.fetch(query, params));
      const post = (await fetchFn(
        groq`*[_type == "blogPost" && slug.current == $slug][0]{ _id, "slug": slug.current }`,
        { slug }
      )) as RawSanityBlogPost | null;

      if (!post || typeof post._id !== 'string') {
        return ApiResponseHandler.notFound('Blog post');
      }

      const viewCount = await trackViewCount(post._id);

      return ApiResponseHandler.success({ viewCount }, 'View count updated successfully');
    }

    return ApiResponseHandler.error('Invalid action', 400);
  } catch (_error) {
    return ApiResponseHandler.error('Failed to update blog post', 500);
  }
}

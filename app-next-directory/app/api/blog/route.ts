import type { QueryParams } from '@sanity/client';
import type { NextRequest } from 'next/server';
import { groq } from 'next-sanity';
import { transformToBlogSummaryDTO } from '@/lib/dto-transformer';
import { client as sanityClient } from '@/lib/sanity/client';
import { ApiResponseHandler } from '@/utils/api-response';

interface RawBlogPost {
  _id: string;
  title: string;
  slug: { current: string };
  primaryImage?: unknown;
  publishedAt: string;
  excerpt?: string;
  tags?: string[];
  authorName?: string;
  authorImage?: unknown;
  readingTime?: number;
  _updatedAt: string;
}

const postsQuery = groq`
  *[_type == "blogPost" && defined(slug)] | order(publishedAt desc) [$start...$end] {
    _id,
    title,
    slug,
    "primaryImage": primaryImage{ ..., asset-> },
    publishedAt,
    excerpt,
    tags,
    "authorName": author->name,
    "authorImage": author->image,
    "readingTime": round(length(pt::text(body)) / 200),
    _updatedAt
  }
`;

const countQuery = groq`count(*[_type == "blogPost" && defined(slug)])`;

const escapeForGroq = (value: string) => value.replace(/"/g, '\\"');

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, Math.max(1, Number.parseInt(searchParams.get('limit') ?? '10', 10)));
    const start = (page - 1) * limit;
    const end = start + limit;

    const rawTag = searchParams.get('tag');
    const rawSearch = searchParams.get('search');
    const tag = rawTag?.trim() ? rawTag.trim() : null;
    const search = rawSearch?.trim() ? rawSearch.trim() : null;

    let finalQuery = postsQuery;
    let finalCountQuery = countQuery;

    if (tag || search) {
      const filterConditions = ['_type == "blogPost"', 'defined(slug)'];

      if (tag) {
        const escaped = escapeForGroq(tag);
        filterConditions.push(`"${escaped}" in tags`);
      }

      if (search) {
        const escaped = escapeForGroq(search);
        filterConditions.push(`title match "*${escaped}*" || pt::text(body) match "*${escaped}*"`);
      }

      const filter = filterConditions.join(' && ');
      finalQuery = groq`
        *[${filter}] | order(publishedAt desc) [$start...$end] {
          _id,
          title,
          slug,
          "primaryImage": primaryImage{ ..., asset-> },
          publishedAt,
          excerpt,
          tags,
          "authorName": author->name,
          "authorImage": author->image,
          "readingTime": round(length(pt::text(body)) / 200),
          _updatedAt
        }
      `;

      finalCountQuery = groq`count(*[${filter}])`;
    }

    const params: Record<string, unknown> = { start, end };
    if (tag) params.tag = tag;
    if (search) params.search = search;

    const [postsRaw, totalCount] = await Promise.all([
      sanityClient().fetch(finalQuery, params as QueryParams),
      sanityClient().fetch(finalCountQuery, params as QueryParams),
    ]);

    const posts = Array.isArray(postsRaw)
      ? postsRaw.map(post => transformToBlogSummaryDTO(post as RawBlogPost))
      : [];

    const total = Number.isFinite(totalCount) ? Number(totalCount) : 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return ApiResponseHandler.success({
      posts,
      pagination: {
        page,
        limit,
        totalCount: total,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
      },
      filters: {
        tag: tag ?? null,
        search: search ?? null,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      const name = error.name;
      const cause = (error as { cause?: { code?: string } }).cause;
      const code = cause?.code ?? (error as { code?: string }).code;

      if (
        name === 'FetchError' ||
        code === 'ECONNREFUSED' ||
        code === 'ENOTFOUND' ||
        code === 'ETIMEDOUT'
      ) {
        return ApiResponseHandler.error('Failed to connect to CMS. Please try again later.', 503);
      }

      if (name === 'ValidationError' || name === 'ZodError') {
        return ApiResponseHandler.error('Invalid search parameters', 400);
      }
    }

    return ApiResponseHandler.error('Failed to fetch blog posts', 500);
  }
}
type FetchFn = (query: string, params?: QueryParams) => Promise<unknown>;
type TransformFn = typeof transformToBlogSummaryDTO;

type BlogRouteTestControl = {
  sanityFetchOverride?: FetchFn;
  transformOverride?: TransformFn;
};

const isTestEnv = process.env.NODE_ENV === 'test';

const _testControl: BlogRouteTestControl | undefined = isTestEnv
  ? {
      sanityFetchOverride: undefined,
      transformOverride: undefined,
    }
  : undefined;

if (process.env.NODE_ENV === 'test') {
  (module.exports as Record<string, unknown>)._testControl = _testControl;
}

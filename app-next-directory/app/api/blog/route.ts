import { client as sanityClient } from '@/lib/sanity/client';
import { ApiResponseHandler } from '@/utils/api-response';
import { transformToBlogSummaryDTO } from '@/lib/dto-transformer';
import { groq } from 'next-sanity';
import { NextRequest } from 'next/server'

// Define the GROQ query to fetch blog posts with pagination
const postsQuery = groq`
  *[_type == "blogPost" && defined(slug)] | order(publishedAt desc) [$start...$end] {
    _id,
    title,
    slug,
    // Include full image object with dereferenced asset for URL + metadata
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

// Count query for total posts
const countQuery = groq`count(*[_type == "blogPost" && defined(slug)])`;

// GET endpoint for fetching blog posts with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const start = (page - 1) * limit;
    const end = start + limit;

    // Filter parameters
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');

    // Build dynamic query based on filters
    let finalQuery = postsQuery;
    let finalCountQuery = countQuery;

    if (tag || search) {
      let filterConditions = ['_type == "blogPost"', 'defined(slug)'];

      if (tag) {
        filterConditions.push(`"${tag}" in tags`);
      }

      if (search) {
        filterConditions.push(`title match "*${search}*" || pt::text(body) match "*${search}*"`);
      }

      const filter = filterConditions.join(' && ');
      finalQuery = groq`
        *[${filter}] | order(publishedAt desc) [$start...$end] {
          _id,
          title,
          slug,
          // Include full image object with dereferenced asset
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

    // Fetch posts and total count in parallel
// In app-next-directory/app/api/blog/route.ts, around lines 80–85
    const params = {
      start,
      end,
      tag: tag || undefined,
      search: search || undefined,
    };    const [postsRaw, totalCount] = await Promise.all([
      sanityClient.fetch(finalQuery, params),
      sanityClient.fetch(finalCountQuery, params),
    ]);
interface RawBlogPost {
  _id: string;
  title: string;
  slug: { current: string };
  primaryImage?: any;
  publishedAt: string;
  excerpt?: string;
  tags?: string[];
  authorName?: string;
  authorImage?: any;
  readingTime?: number;
  _updatedAt: string;
}

const posts = Array.isArray(postsRaw)
  ? postsRaw.map((p: RawBlogPost) => transformToBlogSummaryDTO(p))
  : [];
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const response = {
      posts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
      },
      filters: {
        tag: tag || null,
        search: search || null,
      },
    };

    // Return a single canonical shape
    return ApiResponseHandler.success(response);

  } catch (error) {
    console.error('Error fetching blog posts:', error);

    // Robust error classification without relying on message substrings
    if (error instanceof Error) {
      const name = error.name;
      const cause: any = (error as any).cause;
      const code = cause?.code ?? (error as any).code;

      // Network/connectivity errors (e.g., node-fetch, DNS, refused, timeouts)
      if (
        name === 'FetchError' ||
        code === 'ECONNREFUSED' ||
        code === 'ENOTFOUND' ||
        code === 'ETIMEDOUT'
      ) {
        return ApiResponseHandler.error('Failed to connect to CMS. Please try again later.', 503);
      }

      // Query/validation errors
      if (name === 'ValidationError' || name === 'ZodError') {
        return ApiResponseHandler.error('Invalid search parameters', 400);
      }
    }

    // Safe fallback for unknown errors
    return ApiResponseHandler.error('Failed to fetch blog posts', 500);
  }
}

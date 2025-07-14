import { client as sanityClient } from '@/lib/sanity/client';
import { ApiResponseHandler } from '@/utils/api-response';
import { groq } from 'next-sanity';
import { NextRequest } from 'next/dist/server/web/spec-extension/request';

// Define the GROQ query to fetch blog posts with pagination
const postsQuery = groq`
  *[_type == "blogPost" && defined(slug)] | order(publishedAt desc) [$start...$end] {
    _id,
    title,
    slug,
    mainImage,
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
          mainImage,
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
    const [posts, totalCount] = await Promise.all([
      sanityClient.fetch(finalQuery, { start, end }),
      sanityClient.fetch(finalCountQuery)
    ]);

    // Calculate pagination metadata
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

    return ApiResponseHandler.success(
      response,
      `Found ${totalCount} blog post${totalCount !== 1 ? 's' : ''}`
    );

  } catch (error) {
    console.error('Error fetching blog posts:', error);

    if (error instanceof Error) {
      if (error.message.includes('fetch failed')) {
        return ApiResponseHandler.error('Failed to connect to CMS. Please try again later.', 503);
      }
      if (error.message.includes('Invalid query')) {
        return ApiResponseHandler.error('Invalid search parameters', 400);
      }
    }

    return ApiResponseHandler.error('Failed to fetch blog posts', 500);
  }
}

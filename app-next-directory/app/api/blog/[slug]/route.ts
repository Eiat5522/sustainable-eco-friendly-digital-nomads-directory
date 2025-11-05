import { client as sanityClient } from '@/lib/sanity/client';
import { ApiResponseHandler } from '@/utils/api-response';
import { groq } from 'next-sanity';
import { NextRequest } from 'next/server';
import { transformToBlogDetailDTO } from '@/lib/dto-transformer';

type FetchFn = (query: string, params?: Record<string, unknown>) => Promise<unknown>;
type TransformFn = typeof transformToBlogDetailDTO;

const viewCounts = new Map<string, number>();

const isTestEnv = process.env.NODE_ENV === 'test';

type TestControl = {
  sanityFetchOverride: FetchFn | undefined;
  transformOverride: TransformFn | undefined;
  trackViewCountOverride: ((postId: string) => Promise<number>) | undefined;
  resetViewCounts: () => void;
};

export const testControl: TestControl | undefined = isTestEnv
  ? {
      sanityFetchOverride: undefined,
      transformOverride: undefined,
      trackViewCountOverride: undefined,
      resetViewCounts: () => {
        viewCounts.clear();
      },
    }
  : undefined;

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
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return ApiResponseHandler.error('Blog post slug is required', 400);
    }

    // Fetch the blog post
    const fetchFn =
      testControl?.sanityFetchOverride ??
      ((query: string, params?: Record<string, unknown>) => sanityClient.fetch(query, params));
    const post = await fetchFn(postQuery, { slug });

    if (!post) {
      return ApiResponseHandler.notFound('Blog post');
    }

    const transform = testControl?.transformOverride ?? transformToBlogDetailDTO;
    const dto = transform(post);
    // Ensure related posts in DTO format if present
    const response = {
      post: dto,
      relatedPosts: Array.isArray(dto.relatedPosts) ? dto.relatedPosts : [],
      meta: {
        readingTime: dto.readingTime ?? null,
        publishedDate: dto.publishedAt ?? null,
        lastModified: post._updatedAt,
        wordCount: Array.isArray(dto.body) ? dto.body.length : 0,
      },
    };

    // Return a single canonical payload shape
    return ApiResponseHandler.success(response);

  } catch (error) {
    console.error('Error fetching blog post:', error);

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

// Simple view count tracking (in-memory for demo - consider Redis for production)
async function trackViewCount(postId: string): Promise<number> {
  if (testControl?.trackViewCountOverride) {
    return testControl.trackViewCountOverride(postId);
  }
  const currentCount = viewCounts.get(postId) || 0;
  const newCount = currentCount + 1;
  viewCounts.set(postId, newCount);

  // TODO: In production, persist this to database
  // await updateViewCount(postId, newCount);

  return newCount;
}

// PUT endpoint for updating view count (optional)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    if (body.action === 'increment_view') {
      // Find post ID by slug
      const fetchFn =
        testControl?.sanityFetchOverride ??
        ((query: string, params?: Record<string, unknown>) => sanityClient.fetch(query, params));
      const post = await fetchFn(
        groq`*[_type == "blogPost" && slug.current == $slug][0]{ _id, "slug": slug.current }`,
        { slug }
      );

      if (!post) {
        return ApiResponseHandler.notFound('Blog post');
      }

      const viewCount = await trackViewCount(post._id);

      return ApiResponseHandler.success(
        { viewCount },
        'View count updated successfully'
      );
    }

    return ApiResponseHandler.error('Invalid action', 400);

  } catch (error) {
    console.error('Error updating blog post:', error);
    return ApiResponseHandler.error('Failed to update blog post', 500);
  }
}

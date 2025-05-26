import { client as sanityClient } from '@/lib/sanity/client';
import { ApiResponseHandler } from '@/utils/api-response';
import { groq } from 'next-sanity';
import { NextRequest } from 'next/server';

// GROQ query for fetching a single blog post by slug
const postQuery = groq`
  *[_type == "blogPost" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    mainImage,
    publishedAt,
    excerpt,
    body,
    tags,
    "authorName": author->name,
    "authorImage": author->image,
    "authorBio": author->bio,
    "readingTime": round(length(pt::text(body)) / 200),
    "relatedPosts": *[_type == "blogPost" && slug.current != $slug && count(tags[@ in ^.tags]) > 0] | order(publishedAt desc) [0...3] {
      _id,
      title,
      slug,
      mainImage,
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
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    if (!slug) {
      return ApiResponseHandler.error('Blog post slug is required', 400);
    }

    // Fetch the blog post
    const post = await sanityClient.fetch(postQuery, { slug });

    if (!post) {
      return ApiResponseHandler.notFound('Blog post');
    }

    // Add view count tracking (optional)
    const viewCount = await trackViewCount(post._id);

    const response = {
      ...post,
      viewCount,
      meta: {
        readingTime: post.readingTime,
        publishedDate: post.publishedAt,
        lastModified: post._updatedAt,
        wordCount: post.body ? post.body.length : 0,
      }
    };

    return ApiResponseHandler.success(response, 'Blog post fetched successfully');

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
const viewCounts = new Map<string, number>();

async function trackViewCount(postId: string): Promise<number> {
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
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const body = await request.json();

    if (body.action === 'increment_view') {
      // Find post ID by slug
      const post = await sanityClient.fetch(
        groq`*[_type == "blogPost" && slug.current == $slug][0]{ _id }`,
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

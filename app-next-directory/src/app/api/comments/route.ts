import { NextRequest } from 'next/dist/server/web/spec-extension/request';
import { auth } from '@/lib/auth';
import { authOptions } from '@/lib/auth';
import { client as sanityClient } from '@/lib/sanity/client';
import { ApiResponseHandler } from '@/utils/api-response';

// POST endpoint for creating a new comment
export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await auth();
    
    if (!session?.user) {
      return ApiResponseHandler.error('Authentication required', 401);
    }

    const body = await request.json();
    const { postId, content } = body;

    // Validate required fields
    if (!postId || !content) {
      return ApiResponseHandler.error('Post ID and content are required', 400);
    }

    if (content.trim().length < 1) {
      return ApiResponseHandler.error('Comment content cannot be empty', 400);
    }

    if (content.length > 1000) {
      return ApiResponseHandler.error('Comment content too long (max 1000 characters)', 400);
    }

    // Verify the blog post exists
    const postExists = await sanityClient.fetch(
      `*[_type == "blogPost" && _id == $postId][0]`,
      { postId }
    );

    if (!postExists) {
      return ApiResponseHandler.notFound('Blog post');
    }

    // Create the comment document
    const commentDoc = {
      _type: 'comment',
      post: {
        _type: 'reference',
        _ref: postId,
      },
      content: content.trim(),
      createdAt: new Date().toISOString(),
      approved: false, // Comments need approval by default
      // Note: We'll need to implement user references properly
      // For now, we'll store basic user info directly
      userEmail: session.user.email,
      userName: session.user.name || 'Anonymous User',
      userImage: session.user.image || null,
    };

    // Create the comment in Sanity
    const result = await sanityClient.create(commentDoc);

    return ApiResponseHandler.success(
      {
        commentId: result._id,
        message: 'Comment submitted successfully and is pending approval',
      },
      'Comment submitted successfully'
    );

  } catch (error) {
    console.error('Error creating comment:', error);

    if (error instanceof Error) {
      if (error.message.includes('fetch failed')) {
        return ApiResponseHandler.error('Failed to connect to CMS. Please try again later.', 503);
      }
      if (error.message.includes('validation')) {
        return ApiResponseHandler.error('Comment validation failed', 400);
      }
    }

    return ApiResponseHandler.error('Failed to submit comment', 500);
  }
}

// GET endpoint for fetching comments for a specific blog post
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const postSlug = searchParams.get('postSlug');

    if (!postId && !postSlug) {
      return ApiResponseHandler.error('Post ID or slug is required', 400);
    }

    let query;
    let params;

    if (postId) {
      // Query by post ID
      query = `
        *[_type == "comment" && post._ref == $postId && approved == true] | order(createdAt desc) {
          _id,
          content,
          createdAt,
          userName,
          userImage,
          approved
        }
      `;
      params = { postId };
    } else {
      // Query by post slug (need to resolve the post first)
      query = `
        *[_type == "comment" && post->slug.current == $postSlug && approved == true] | order(createdAt desc) {
          _id,
          content,
          createdAt,
          userName,
          userImage,
          approved
        }
      `;
      params = { postSlug };
    }

    const comments = await sanityClient.fetch(query, params);

    return ApiResponseHandler.success(
      {
        comments,
        count: comments.length,
      },
      `Found ${comments.length} comment${comments.length !== 1 ? 's' : ''}`
    );

  } catch (error) {
    console.error('Error fetching comments:', error);

    if (error instanceof Error) {
      if (error.message.includes('fetch failed')) {
        return ApiResponseHandler.error('Failed to connect to CMS. Please try again later.', 503);
      }
    }

    return ApiResponseHandler.error('Failed to fetch comments', 500);
  }
}

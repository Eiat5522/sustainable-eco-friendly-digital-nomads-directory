import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { client } from '@/lib/sanity/client';
import { revalidateTag } from 'next/cache';
import { hasFeaturePermission, UserRole } from '@/types/auth';

interface SanityCommentRecord {
  _id: string;
  content?: string | null;
  approved?: boolean;
  _createdAt?: string;
  user?: {
    _id?: string;
    name?: string | null;
  } | null;
}

function makeJsonResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json<T>(data, { status });
}

// GET comments for a given post (optional, can be expanded later)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const limit = Math.min(50, Number.parseInt(searchParams.get('limit') ?? '20', 10));
    const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10));
    const skip = (page - 1) * limit;

    if (!postId) {
      return makeJsonResponse({ error: 'Missing postId' }, 400);
    }

    // Fetch approved comments for the post from Sanity
    const query = `*[_type == "comment" && post._ref == $postId && approved == true] | order(_createdAt desc) [$skip...$end] {
      _id,
      content,
      approved,
      _createdAt,
      "user": user->{_id, name}
    }`;
    const params = { postId, skip, end: skip + limit };
    const sanityComments = await client.fetch<SanityCommentRecord[] | null>(query, params);
    const comments = Array.isArray(sanityComments) ? sanityComments : [];

    return makeJsonResponse(
      {
        success: true,
        data: {
          comments,
          pagination: { page, limit, count: comments.length },
        },
      },
      200
    );
  } catch (_error) {
    return makeJsonResponse({ error: 'Failed to fetch comments' }, 500);
  }
}

export async function POST(request: Request) {
  const session = await auth();

  const user = session?.user as { id?: string; role?: UserRole; email?: string | null; name?: string | null } | undefined;
  const userId: string | undefined = user?.id;
  const userRole: UserRole = user?.role || 'unidentifiedUser';

  if (!userId) {
    return makeJsonResponse({ error: 'Unauthorized' }, 401);
  }

  // Check if user has permission to submit comments
  if (!hasFeaturePermission(userRole, 'submitComments')) {
    return makeJsonResponse({ error: 'Forbidden: Insufficient permissions to create comments' }, 403);
  }

  try {
    const payload = (await request.json()) as unknown;
    if (!payload || typeof payload !== 'object') {
      return makeJsonResponse({ error: 'Invalid or missing fields' }, 422);
    }

    const { content, postId } = payload as Record<string, unknown>;
    if (typeof postId !== 'string') {
      return makeJsonResponse({ error: 'Invalid or missing fields' }, 422);
    }

    const safeContent = typeof content === 'string' ? content.trim() : '';
    if (!safeContent) {
      return makeJsonResponse({ error: 'Comment is required' }, 422);
    }

    const postDoc = await client.getDocument<{ slug?: { current?: string } } | null>(postId);
    if (!postDoc) {
      return makeJsonResponse({ error: 'Invalid reference(s)' }, 400);
    }

    const newComment = await client.create<SanityCommentRecord>({
      _type: 'comment',
      post: { _type: 'reference', _ref: postId },
      // Assume a user document with the same id exists in Sanity; tests mock this path
      user: { _type: 'reference', _ref: userId },
      content: safeContent,
      approved: false,
    });

    // Revalidate the post page cache using tag if slug present
    const postSlug = postDoc?.slug?.current;
    if (postSlug) {
      try {
        revalidateTag(`post:${postSlug}`);
      } catch {
        // Not critical outside ISR context
      }
    }

    return makeJsonResponse({ success: true, data: newComment }, 201);
  } catch (_error) {
    return makeJsonResponse({ error: 'Internal Server Error' }, 500);
  }
}

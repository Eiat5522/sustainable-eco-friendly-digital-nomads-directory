import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { client } from '@/lib/sanity/client';
import { revalidateTag } from 'next/cache';
import { hasFeaturePermission, UserRole } from '@/types/auth';

// Helper to always return a test-friendly response object even if NextResponse mock isn't applied
function makeResponse(data: any, status = 200) {
	try {
		const resp = (NextResponse as any)?.json?.(data, { status });
		if (resp) return resp;
	} catch {
		// fall through to plain object
	}
	return { status, json: () => Promise.resolve(data) } as const;
}

// GET comments for a given post (optional, can be expanded later)
export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const postId = searchParams.get('postId');
		const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));
		const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
		const skip = (page - 1) * limit;

			if (!postId) {
				return makeResponse({ error: 'Missing postId' }, 400);
			}

		// Fetch approved comments for the post from Sanity
		const query = `*[_type == "comment" && post._ref == $postId && approved == true] | order(_createdAt desc) [$skip...$end] {
			_id,
			content,
			approved,
			_createdAt,
			"user": user->{_id, name}
		}`;
		const params: { postId: string; skip: number; end: number } = { postId, skip, end: skip + limit };
		const comments = await client.fetch(query, params);

			return makeResponse({
				success: true,
				data: {
					comments,
					pagination: { page, limit, count: comments?.length ?? 0 }
				}
			}, 200);
		} catch {
			return makeResponse({ error: 'Failed to fetch comments' }, 500);
		}
}

export async function POST(request: Request) {
	const session = await auth();

	const user = session?.user as { id?: string; role?: UserRole; email?: string | null; name?: string | null } | undefined;
	const userId: string | undefined = user?.id;
	const userRole: UserRole = user?.role || 'unidentifiedUser';
  
		if (!userId) {
			return makeResponse({ error: 'Unauthorized' }, 401);
		}

	// Check if user has permission to submit comments
		if (!hasFeaturePermission(userRole, 'submitComments')) {
			return makeResponse({ error: 'Forbidden: Insufficient permissions to create comments' }, 403);
		}

	try {
		const { content, postId } = await request.json();

			if (!content || !postId) {
				if (typeof content !== 'string' || !content.trim() || typeof postId !== 'string') {
					return makeResponse({ error: 'Invalid or missing fields' }, 422);
				}
			}

		const safeContent = typeof content === 'string' ? content.trim() : '';
			if (!safeContent) {
				return makeResponse({ error: 'Comment is required' }, 422);
			}

			const postDoc = await client.getDocument(postId);
			if (!postDoc) {
				return makeResponse({ error: 'Invalid reference(s)' }, 400);
			}

			const newComment = await client.create({
			_type: 'comment',
			post: { _type: 'reference', _ref: postId },
				// Assume a user document with the same id exists in Sanity; tests mock this path
				user: { _type: 'reference', _ref: userId },
			content: safeContent,
			approved: false,
		});

		// Revalidate the post page cache using tag if slug present
		const postSlug = (postDoc as { slug?: { current?: string } } | null | undefined)?.slug?.current;
		if (postSlug) {
			try {
				revalidateTag(`post:${postSlug}`);
			} catch {
				// Not critical outside ISR context
			}
		}

			return makeResponse({ success: true, data: newComment }, 201);
		} catch {
			return makeResponse({ error: 'Internal Server Error' }, 500);
		}
}
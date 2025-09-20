import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { client } from '@/lib/sanity/client';
import { revalidateTag } from 'next/cache';
import { hasFeaturePermission, UserRole } from '@/types/auth';
import { ensureSanityUser } from '@/lib/sanity/user';

// GET comments for a given post (optional, can be expanded later)
export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const postId = searchParams.get('postId');
		const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));
		const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
		const skip = (page - 1) * limit;

		if (!postId) {
			return NextResponse.json({ error: 'Missing postId' }, { status: 400 });
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

		return NextResponse.json({
			success: true,
			data: {
				comments,
				pagination: { page, limit, count: comments?.length ?? 0 }
			}
		});
			} catch {
		return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
	}
}

export async function POST(request: Request) {
	const session = await auth();

	const user = session?.user as { id?: string; role?: UserRole; email?: string | null; name?: string | null } | undefined;
	const userId: string | undefined = user?.id;
	const userRole: UserRole = user?.role || 'unidentifiedUser';
  
	if (!userId) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Check if user has permission to submit comments
	if (!hasFeaturePermission(userRole, 'submitComments')) {
		return NextResponse.json({ error: 'Forbidden: Insufficient permissions to create comments' }, { status: 403 });
	}

	try {
		const { content, postId } = await request.json();

		if (!content || !postId) {
			if (typeof content !== 'string' || !content.trim() || typeof postId !== 'string') {
				return NextResponse.json({ error: 'Invalid or missing fields' }, { status: 422 });
			}
		}

		const safeContent = typeof content === 'string' ? content.trim() : '';
		if (!safeContent) {
			return NextResponse.json({ error: 'Comment is required' }, { status: 422 });
		}

		const [postDoc, sanityUser] = await Promise.all([
			client.getDocument(postId),
			ensureSanityUser({
				id: userId,
				name: user?.name ?? null,
				email: user?.email ?? null,
				role: userRole,
			}),
		]);

		if (!postDoc || !sanityUser) {
			return NextResponse.json({ error: 'Invalid reference(s)' }, { status: 400 });
		}

		const newComment = await client.create({
			_type: 'comment',
			post: { _type: 'reference', _ref: postId },
			user: { _type: 'reference', _ref: sanityUser._id },
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

		return NextResponse.json({ success: true, data: newComment }, { status: 201 });
			} catch {
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

import { client } from '@/lib/sanity/client';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { revalidateTag } from 'next/cache';
import { hasFeaturePermission, UserRole } from '@/types/auth';

export async function POST(request: Request) {
  const session = await auth();

  const user = session?.user as { id?: string; role?: UserRole } | undefined;
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

    // Validate referenced documents to avoid dangling references
    const [postDoc, userDoc] = await Promise.all([
      client.getDocument(postId),
      client.getDocument(userId),
    ]);

    if (!postDoc || !userDoc) {
      return NextResponse.json({ error: 'Invalid reference(s)' }, { status: 400 });
    }

    const newComment = await client.create({
      _type: 'comment',
      post: { _type: 'reference', _ref: postId },
      user: { _type: 'reference', _ref: userId },
      content,
      approved: false,
    });
    // Attempt to revalidate the post page cache using tag if slug present
    const postSlug = (postDoc as any)?.slug?.current as string | undefined;
    if (postSlug) {
      try {
        revalidateTag(`post:${postSlug}`);
      } catch {
        // ignore if not in a revalidatable context
      }
    }

    return NextResponse.json(newComment);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

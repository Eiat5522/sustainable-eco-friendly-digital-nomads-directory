
import { client } from '@/lib/sanity/client';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { revalidateTag } from 'next/cache';
import { hasFeaturePermission, UserRole } from '@/types/auth';
import { ensureSanityUser } from '@/lib/sanity/user';

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


import { client } from '@/lib/sanity/client';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  const user = session?.user as { id?: string } | undefined;
  const userId: string | undefined = user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    return NextResponse.json(newComment);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

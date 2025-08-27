
import { client } from '@/lib/sanity/client';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { content, postId } = await request.json();

    if (!content || !postId) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const newComment = await client.create({
      _type: 'comment',
      post: { _type: 'reference', _ref: postId },
      user: { _type: 'reference', _ref: session.user.id },
      content,
      approved: false,
    });

    return NextResponse.json(newComment);
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

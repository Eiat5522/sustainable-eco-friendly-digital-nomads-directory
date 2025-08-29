
import { client } from '@/lib/sanity/client';
import { groq } from 'next-sanity';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const post = await client.fetch(
      groq`*[_type == "blogPost" && slug.current == $slug][0]`,
      { slug: params.slug }
    );

    if (!post) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const comments = await client.fetch(
      groq`*[_type == "comment" && post._ref == $postId && approved == true] | order(createdAt asc) {
        _id,
        content,
        user->{ name }
      }`,
      { postId: post._id }
    );

    return NextResponse.json({ post, comments });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

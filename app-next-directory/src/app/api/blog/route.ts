
import { client } from '@/lib/sanity/client';
import { groq } from 'next-sanity';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const posts = await client.fetch(
      groq`*[
        _type == "blogPost" &&
        !(_id in path('drafts.**')) &&
        defined(publishedAt) &&
        publishedAt <= now()
      ] | order(publishedAt desc, _createdAt desc)`
    );
    return NextResponse.json(posts);
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

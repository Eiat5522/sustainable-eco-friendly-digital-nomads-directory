
import { PortableText } from '@portabletext/react';
import { client } from '@/lib/sanity/client';
import { groq } from 'next-sanity';
import { notFound } from 'next/navigation';

import CommentForm from '@/components/CommentForm';
import CommentList from '@/components/CommentList';

import type { PortableTextBlock } from '@portabletext/types';

async function getPost(slug: string): Promise<PostResponse> {  const base = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!base) {
    throw new Error('Environment variable NEXT_PUBLIC_API_URL is not set');
  }
  let url: URL;
  try {
    url = new URL(`/api/blog/${encodeURIComponent(slug)}`, base);
  } catch {
    throw new Error(`Invalid NEXT_PUBLIC_API_URL: "${base}"`);
  }
    const res = await fetch(url.toString(), { next: { revalidate: 60, tags: [`post:${slug}`] } });
  if (res.status === 404) {
    notFound();
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch post: ${res.status} ${res.statusText}`);
  }
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    throw new Error(`Unexpected content-type: ${ct}`);
  }
  return (await res.json()) as PostResponse;
}

 // minimal response type
 type Comment = { _id: string; content: string; user?: { name?: string } | null };
 type PostResponse = {
   post: { _id: string; title: string; body: PortableTextBlock[] };
   comments: Comment[];
 };

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const { post, comments } = await getPost(params.slug);

  return (
    <div className="container mx-auto px-4 py-8">
      <article className="prose lg:prose-xl max-w-none">
        <h1 className="text-5xl font-extrabold text-center mb-12 text-gray-900">{post.title}</h1>
        <div className="bg-white border-4 border-black rounded-lg shadow-lg p-8">
          <PortableText value={post.body} />
        </div>
      </article>
      <div className="mt-16">
        <h2 className="text-4xl font-bold mb-8 text-gray-800">Comments</h2>
        <CommentList comments={comments} />
        <CommentForm postId={post._id} />
      </div>
    </div>
  );
}

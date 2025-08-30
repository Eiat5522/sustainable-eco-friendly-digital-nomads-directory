
import { PortableText } from '@portabletext/react';
import { notFound } from 'next/navigation';
import { getBaseUrl } from '@/lib/absolute-url';
import { client } from '@/lib/sanity/client';
import { groq } from 'next-sanity';
import type { Metadata } from 'next'

import CommentForm from '@/components/CommentForm';
import CommentList from '@/components/CommentList';

import type { PortableTextBlock } from '@portabletext/types';

async function getPost(slug: string): Promise<PostResponse> {
  const url = new URL(`/api/blog/${encodeURIComponent(slug)}`, await getBaseUrl());
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
  const json = await res.json();
  // If using src API shape
  if (json && typeof json === 'object' && 'post' in json && 'comments' in json) {
    return json as PostResponse;
  }
  // If using app API shape, fetch approved comments separately
  const data = json && typeof json === 'object' && 'success' in json ? (json as any).data : json;
  const post = { _id: data?._id, title: data?.title, body: data?.body } as PostResponse['post'];
  const comments = await client.fetch(
    groq`*[_type == "comment" && post->slug.current == $slug && approved == true] | order(createdAt asc){ _id, content, user->{ name } }`,
    { slug }
  );
  return { post, comments } as PostResponse;
}

 // minimal response type
 type Comment = { _id: string; content: string; user?: { name?: string } | null };
 type PostResponse = {
   post: { _id: string; title: string; body: PortableTextBlock[] };
   comments: Comment[];
 };

export default async function BlogPostPage({ params }: Readonly<{ params: { slug: string } }>) {
  // Support Next 14 (sync) and Next 15 (async) params
  const { slug } = await Promise.resolve(params as unknown as { slug: string });
  const { post, comments } = await getPost(slug);

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

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const base = await getBaseUrl();
  const { slug } = await Promise.resolve(params as unknown as { slug: string });
  const url = new URL(`/api/blog/${encodeURIComponent(slug)}`, base);
  try {
    const res = await fetch(url.toString(), { next: { revalidate: 300 } });
    if (res.status === 404) return { title: 'Post not found' };
    if (!res.ok) return { title: 'Blog' };
    const json = await res.json();
    let title: string | undefined;
    let description: string | undefined;
    let imageUrl: string | undefined;

    if (json && typeof json === 'object' && 'success' in json) {
      const data = (json as any).data;
      title = data?.title;
      description = data?.excerpt ?? undefined;
      imageUrl = data?.primaryImage?.asset?.url ?? undefined;
    } else if (json && typeof json === 'object' && 'post' in json) {
      const post = (json as any).post;
      title = post?.title;
      description = post?.excerpt ?? undefined;
      imageUrl = post?.primaryImage?.asset?.url ?? undefined;
    }

    const absoluteImage = imageUrl && imageUrl.startsWith('http') ? imageUrl : (imageUrl ? new URL(imageUrl, base).toString() : undefined);

    return {
      title: title || 'Blog',
      description: description || undefined,
      openGraph: {
        title: title || 'Blog',
        description: description || undefined,
        type: 'article',
        url: new URL(`/blog/${slug}`, base).toString(),
        images: absoluteImage ? [{ url: absoluteImage }] : undefined,
      },
      twitter: {
        card: absoluteImage ? 'summary_large_image' : 'summary',
        title: title || 'Blog',
        description: description || undefined,
        images: absoluteImage ? [absoluteImage] : undefined,
      },
    }
  } catch {
    return { title: 'Blog' }
  }
}

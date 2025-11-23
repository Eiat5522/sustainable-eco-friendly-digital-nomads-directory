import { PortableText } from '@portabletext/react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { groq } from 'next-sanity';
import { blogPortableTextComponents } from '@/components/blog/portableTextComponents';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { getBaseUrl } from '@/lib/absolute-url';
import { client } from '@/lib/sanity/client';

// Subtle SVG gradient placeholder for hero image when missing
function placeholderDataUri(width = 1200, height = 630) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#f3f4f6'/><stop offset='1' stop-color='#e5e7eb'/></linearGradient></defs><rect width='100%' height='100%' fill='url(#g)'/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

import type { PortableTextBlock } from '@portabletext/types';
import CommentForm from '@/components/CommentForm';
import CommentList from '@/components/CommentList';

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
  // Prefer DTO-wrapped API shape
  if (json && typeof json === 'object' && 'success' in json) {
    const data = (json as { data?: { post?: PostResponse['post'] } }).data;
    const post = data?.post;
    if (!post?.id) {
      notFound();
    }
    const comments = await client.fetch(
      groq`*[_type == "comment" && post->slug.current == $slug && approved == true] | order(createdAt asc){ _id, content, user->{ name } }`,
      { slug }
    );
    return { post, comments } as PostResponse;
  }
  // Fallback to legacy src API shape
  if (json && typeof json === 'object' && 'post' in json && 'comments' in json) {
    return json as PostResponse;
  }
  // Minimal fallback
  type Json = Record<string, unknown>;
  const data = (json ?? {}) as Json;
  const id =
    typeof (data as { id?: unknown }).id === 'string' && (data as { id: string }).id.trim()
      ? (data as { id: string }).id
      : typeof (data as { _id?: unknown })._id === 'string' && (data as { _id: string })._id.trim()
        ? (data as { _id: string })._id
        : '';
  const title =
    typeof (data as { title?: unknown }).title === 'string'
      ? (data as { title: string }).title
      : '';
  const body = Array.isArray((data as { body?: unknown }).body)
    ? (data as { body: PortableTextBlock[] }).body
    : [];
  const imageUrl =
    typeof (data as { imageUrl?: unknown }).imageUrl === 'string'
      ? (data as { imageUrl: string }).imageUrl
      : ((data as { primaryImage?: { asset?: { url?: string } } })?.primaryImage?.asset?.url ??
        null);
  const post: PostDTO = { id, title, body, imageUrl };
  if (!post.id) {
    notFound();
  }
  const comments = await client.fetch(
    groq`*[_type == "comment" && post->slug.current == $slug && approved == true]
      | order(createdAt asc){ _id, content, user->{ name } }`,
    { slug }
  );
  return { post, comments } as PostResponse;
}

// minimal response type
type Comment = { _id: string; content: string; user?: { name?: string } | null };
type PostDTO = { id: string; title: string; body: PortableTextBlock[]; imageUrl?: string | null };
type PostResponse = { post: PostDTO; comments: Comment[] };

export default async function BlogPostPage({ params }: Readonly<{ params: { slug: string } }>) {
  // Support Next 14 (sync) and Next 15 (async) params
  const { slug } = await Promise.resolve(params as unknown as { slug: string });
  const { post, comments } = await getPost(slug);

  const heroUrl: string | null = post.imageUrl ?? null;
  const usingPlaceholder = !heroUrl;
  const src = heroUrl ?? placeholderDataUri(1200, 630);
  const alt = usingPlaceholder ? '' : post.title || '';

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <article className="prose lg:prose-xl max-w-none">
          <h1 className="text-5xl font-extrabold text-center mb-6 text-gray-900">{post.title}</h1>
          <div className="relative w-full h-64 md:h-96 mb-8 border-4 border-black rounded-lg overflow-hidden">
            <Image
              src={src}
              alt={alt}
              aria-hidden={usingPlaceholder}
              fill
              className="object-cover"
              sizes="100vw"
              placeholder={usingPlaceholder ? 'empty' : 'blur'}
              blurDataURL={usingPlaceholder ? undefined : placeholderDataUri(1200, 630)}
              priority={!usingPlaceholder}
            />
          </div>
          <div className="bg-white border-4 border-black rounded-lg shadow-lg p-8">
            <PortableText value={post.body} components={blogPortableTextComponents} />
          </div>
        </article>
        <div className="mt-16">
          <h2 className="text-4xl font-bold mb-8 text-gray-800">Comments</h2>
          <CommentList comments={comments} />
          <CommentForm postId={post.id} />
        </div>
      </main>
      <Footer />
    </>
  );
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
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
      const data = (
        json as { data?: { post?: { title?: string; excerpt?: string; imageUrl?: string } } }
      ).data;
      const post = data?.post;
      title = post?.title;
      description = post?.excerpt ?? undefined;
      imageUrl = post?.imageUrl ?? undefined;
    } else if (json && typeof json === 'object' && 'post' in json) {
      const post = (json as { post: { title?: string; excerpt?: string; imageUrl?: string } }).post;
      title = post?.title;
      description = post?.excerpt ?? undefined;
      imageUrl = post?.imageUrl ?? undefined;
    }

    const absoluteImage = imageUrl?.startsWith('http')
      ? imageUrl
      : imageUrl
        ? new URL(imageUrl, base).toString()
        : undefined;

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
    };
  } catch {
    return { title: 'Blog' };
  }
}

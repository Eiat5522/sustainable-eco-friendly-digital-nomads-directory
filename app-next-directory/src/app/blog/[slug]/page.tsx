
import { PortableText } from '@portabletext/react';
import { notFound } from 'next/navigation';
import { getBaseUrl } from '@/lib/absolute-url';
import { client } from '@/lib/sanity/client';
import { groq } from 'next-sanity';
import type { Metadata } from 'next'
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import styles from './newspaper.module.css';

// Subtle SVG gradient placeholder for hero image when missing
function placeholderDataUri(width = 1200, height = 630) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#f3f4f6'/><stop offset='1' stop-color='#e5e7eb'/></linearGradient></defs><rect width='100%' height='100%' fill='url(#g)'/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

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
  // Prefer DTO-wrapped API shape
  if (json && typeof json === 'object' && 'success' in json) {
    const data = (json as any).data;
    const post = data?.post as PostResponse['post'] | undefined;
    const comments = data?.comments || [];
    if (!post?.id) {
      notFound();
    }
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
    typeof (data as any).id === 'string' && (data as any).id.trim()
      ? (data as any).id
      : (typeof (data as any)._id === 'string' && (data as any)._id.trim() ? (data as any)._id : '');
  const title = typeof (data as any).title === 'string' ? (data as any).title : '';
  const body = Array.isArray((data as any).body) ? ((data as any).body as PortableTextBlock[]) : [];
  const imageUrl =
    typeof (data as any).imageUrl === 'string'
      ? (data as any).imageUrl
      : ((data as any)?.primaryImage?.asset?.url ?? null);
  const post: PostDTO = { id, title, body, imageUrl };
  if (!post.id) {
    notFound();
  }
  return { post, comments: [] } as PostResponse;
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
  const alt = usingPlaceholder ? '' : (post.title || '');

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Newspaper Masthead */}
        <div className="border-8 border-black bg-white mb-8 p-6">
          <div className="text-center">
            <div className="text-xs font-bold tracking-widest uppercase mb-2">The Nomad's Chronicle</div>
            <div className="border-t-2 border-b-2 border-black py-2">
              <div className="text-xs font-bold tracking-wider uppercase">
                Sustainability • Travel • Remote Work
              </div>
            </div>
          </div>
        </div>

        <article className="max-w-5xl mx-auto">
          {/* Article Header */}
          <div className="bg-white border-8 border-black p-8 md:p-12 mb-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <div className="border-b-4 border-black pb-6 mb-6">
              <h1 className="text-5xl md:text-7xl font-black leading-none mb-6" style={{ fontFamily: 'serif' }}>
                {post.title}
              </h1>
              
              {/* Byline */}
              <div className="flex flex-wrap items-center gap-4 text-sm font-bold uppercase tracking-wide border-t-2 border-black pt-4">
                <div className="flex items-center gap-2">
                  <span className="bg-black text-white px-3 py-1">Breaking News</span>
                </div>
                <div className="flex-1 border-l-2 border-black pl-4">
                  <div>Published by The Chronicle Staff</div>
                  <div className="text-xs text-gray-600 normal-case mt-1">Special Correspondent</div>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative w-full h-96 md:h-[600px] border-8 border-black mb-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
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

            {/* Article Body */}
            <div className={`prose prose-lg max-w-none ${styles.newspaperContent}`}>
              <PortableText value={post.body} />
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-yellow-100 border-8 border-black p-8 md:p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <div className="border-b-4 border-black pb-4 mb-8">
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-wide" style={{ fontFamily: 'serif' }}>
                Letters to the Editor
              </h2>
              <p className="text-sm font-bold uppercase tracking-wide mt-2">
                Join the conversation
              </p>
            </div>
            
            <div className="bg-white border-4 border-black p-6 mb-6">
              <CommentList comments={comments} />
            </div>
            
            <div className="bg-white border-4 border-black p-6">
              <h3 className="text-2xl font-black uppercase mb-4 border-b-2 border-black pb-2">
                Submit Your Letter
              </h3>
              <CommentForm postId={post.id} />
            </div>
          </div>
        </article>

        {/* Back to Chronicle */}
        <div className="text-center mt-12">
          <Link 
            href="/blog"
            className="inline-block px-8 py-4 bg-white border-6 border-black font-black uppercase text-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-300 transition-all"
          >
            ← Back to The Chronicle
          </Link>
        </div>
      </main>
      <Footer />
    </>
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
      const post = data?.post as { title?: string; excerpt?: string; imageUrl?: string } | undefined;
      title = post?.title;
      description = post?.excerpt ?? undefined;
      imageUrl = post?.imageUrl ?? undefined;
    } else if (json && typeof json === 'object' && 'post' in json) {
      const post = (json as any).post as { title?: string; excerpt?: string; imageUrl?: string };
      title = post?.title;
      description = post?.excerpt ?? undefined;
      imageUrl = post?.imageUrl ?? undefined;
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

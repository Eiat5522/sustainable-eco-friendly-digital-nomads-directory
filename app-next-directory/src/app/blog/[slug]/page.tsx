
import { PortableText, type PortableTextComponents } from '@portabletext/react';
import { notFound } from 'next/navigation';
import { getBaseUrl } from '@/lib/absolute-url';
import { client } from '@/lib/sanity/client';
import { groq } from 'next-sanity';
import type { Metadata } from 'next'
import Image from 'next/image';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

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
  const fallbackPost: PostDTO = {
    id: 'placeholder-post',
    title: 'Dispatch coming soon',
    body: [
      {
        _key: 'fallback-0',
        _type: 'block',
        style: 'normal',
        children: [
          { _key: 'fallback-0-0', _type: 'span', text: 'Our correspondents are gathering fresh insights for this story. Please check back soon for the full report on sustainable nomad life.' },
        ],
        markDefs: [],
      },
      {
        _key: 'fallback-1',
        _type: 'block',
        style: 'normal',
        children: [
          { _key: 'fallback-1-0', _type: 'span', text: 'In the meantime, explore other sections of The Nomad’s Chronicle for eco-minded itineraries, community spotlights, and practical tips for life on the move.' },
        ],
        markDefs: [],
      },
    ],
    imageUrl: null,
  };

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 60, tags: [`post:${slug}`] } });
    if (res.status === 404) {
      notFound();
    }
    if (!res.ok) {
      console.error(`Failed to fetch post: ${res.status} ${res.statusText}`);
      return { post: fallbackPost, comments: [] };
    }
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      console.error(`Unexpected content-type: ${ct}`);
      return { post: fallbackPost, comments: [] };
    }
    const json = await res.json();
  // Prefer DTO-wrapped API shape
  if (json && typeof json === 'object' && 'success' in json) {
    const data = (json as any).data;
    const post = data?.post as PostResponse['post'] | undefined;
    if (!post?.id) {
      console.error('Blog API responded with success but missing post data');
      return { post: fallbackPost, comments: [] };
    }
    let comments: Comment[] = [];
    try {
      comments = await client.fetch(
        groq`*[_type == "comment" && post->slug.current == $slug && approved == true] | order(createdAt asc){ _id, content, user->{ name } }`,
        { slug }
      );
    } catch (error) {
      console.error('Failed to fetch comments for post', slug, error);
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
    console.error('Post payload missing id, returning fallback');
    return { post: fallbackPost, comments: [] };
  }
    let comments: Comment[] = [];
    try {
      comments = await client.fetch(
        groq`*[_type == "comment" && post->slug.current == $slug && approved == true]
      | order(createdAt asc){ _id, content, user->{ name } }`,
        { slug }
      );
    } catch (error) {
      console.error('Failed to fetch comments for post', slug, error);
    }
    return { post, comments } as PostResponse;
  } catch (error) {
    console.error('Unable to load blog post', slug, error);
    return { post: fallbackPost, comments: [] };
  }
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

  let isFirstParagraph = true;
  const portableTextComponents: PortableTextComponents = {
    block: {
      normal: ({ children }) => {
        const isLead = isFirstParagraph;
        isFirstParagraph = false;
        return (
          <p
            className={`mb-6 text-lg leading-relaxed text-gray-800 md:text-xl ${
              isLead
                ? 'first-letter:float-left first-letter:mr-3 first-letter:font-black first-letter:text-6xl first-letter:leading-[0.8] first-letter:uppercase'
                : ''
            }`}
          >
            {children}
          </p>
        );
      },
      h2: ({ children }) => (
        <h2 className="mt-12 font-serif text-3xl font-bold uppercase tracking-[0.3em] text-gray-900">
          {children}
        </h2>
      ),
      h3: ({ children }) => (
        <h3 className="mt-10 font-serif text-2xl font-semibold uppercase tracking-[0.28em] text-gray-900">
          {children}
        </h3>
      ),
      blockquote: ({ children }) => (
        <blockquote className="my-8 border-l-4 border-black/70 bg-[#f8f2e4] px-6 py-4 font-serif text-lg italic text-gray-800 shadow-[6px_6px_0_rgba(0,0,0,0.08)]">
          {children}
        </blockquote>
      ),
    },
    list: {
      bullet: ({ children }) => (
        <ul className="my-6 list-disc pl-8 text-lg leading-relaxed text-gray-800">{children}</ul>
      ),
      number: ({ children }) => (
        <ol className="my-6 list-decimal pl-8 text-lg leading-relaxed text-gray-800">{children}</ol>
      ),
    },
    marks: {
      em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
      strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
      link: ({ children, value }) => (
        <a
          href={value?.href}
          className="border-b border-black text-gray-900 transition hover:bg-black hover:text-[#fefcf6]"
          target={value?.href?.startsWith('http') ? '_blank' : undefined}
          rel={value?.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
        >
          {children}
        </a>
      ),
    },
  };

  const dateline = new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(new Date());

  return (
    <>
      <Header />
      <main className="bg-[#f8f2e4] text-gray-900">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <article className="border border-black bg-[#fefcf6] shadow-[14px_14px_0_rgba(0,0,0,0.06)]">
            <header className="border-b border-black px-6 py-10 text-center">
              <p className="text-xs uppercase tracking-[0.35em] text-gray-600">{dateline}</p>
              <h1 className="mt-4 font-serif text-4xl font-black uppercase leading-tight md:text-5xl">{post.title}</h1>
            </header>
            <div className="border-b border-black bg-[#f9f5ea] px-6 py-6">
              <div className="relative mx-auto aspect-[3/2] w-full max-w-3xl border border-black/80 bg-[#fefaf0] shadow-[8px_8px_0_rgba(0,0,0,0.08)]">
                <Image
                  src={src}
                  alt={alt}
                  aria-hidden={usingPlaceholder}
                  fill
                  className="object-cover grayscale-[20%]"
                  sizes="(min-width: 1024px) 70vw, 100vw"
                  placeholder={usingPlaceholder ? 'empty' : 'blur'}
                  blurDataURL={usingPlaceholder ? undefined : placeholderDataUri(1200, 630)}
                  priority={!usingPlaceholder}
                />
              </div>
            </div>
            <div className="px-6 py-10 font-serif">
              <PortableText value={post.body} components={portableTextComponents} />
              <div className="mt-12 border-t border-black/60 pt-6 text-xs uppercase tracking-[0.35em] text-gray-500">
                Filed under The Nomad's Chronicle
              </div>
            </div>
          </article>

          <section className="mt-12 border border-black bg-[#fffdf7] px-6 py-10 shadow-[10px_10px_0_rgba(0,0,0,0.05)]">
            <h2 className="font-serif text-2xl font-semibold uppercase tracking-[0.35em] text-gray-900">Letters to the Editor</h2>
            <p className="mt-2 text-sm text-gray-600">
              Share your reflections on this story. Thoughtful discourse keeps our global community thriving.
            </p>
            <div className="mt-8 space-y-10">
              <CommentList comments={comments} />
              <CommentForm postId={post.id} />
            </div>
          </section>
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

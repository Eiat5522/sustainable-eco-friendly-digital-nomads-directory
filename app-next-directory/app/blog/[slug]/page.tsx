import { PortableText } from '@portabletext/react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { blogPortableTextComponents } from '@/components/blog/portableTextComponents';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { client as sanityClient } from '@/lib/sanity/client';

// Subtle SVG gradient placeholder for hero image when missing
function placeholderDataUri(width = 1200, height = 630) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#f3f4f6'/><stop offset='1' stop-color='#e5e7eb'/></linearGradient></defs><rect width='100%' height='100%' fill='url(#g)'/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

import type { PortableTextBlock } from '@portabletext/types';
import CommentForm from '@/components/CommentForm';
import CommentList from '@/components/CommentList';
import { getPostCached } from './data';

// minimal response type
type Comment = { _id: string; content: string; user?: { name?: string } | null };
type PostDTO = {
  id: string;
  title: string;
  body: PortableTextBlock[];
  imageUrl?: string | null;
  excerpt?: string | null;
};
type PostResponse = { post: PostDTO; comments: Comment[] };

export default async function BlogPostPage(props: Readonly<{ params: Promise<{ slug: string }> }>) {
  const resolvedParams = await props.params;
  const { slug } = resolvedParams;

  let post: PostDTO;
  let comments: Comment[];
  try {
    const res = await getPostCached(slug); // <--- Data fetching happens here
    // API may return wrapped DTO or legacy shape
    if (res && typeof res === 'object' && 'success' in res) {
      const data = (res as { success: boolean; data?: { post: PostDTO; comments?: Comment[] } }).data;
      post = data?.post!;
      comments = data?.comments ?? [];
    } else if (res && typeof res === 'object' && 'post' in res && 'comments' in res) {
      post = res.post as PostDTO; // Specify type
      comments = res.comments as Comment[]; // Specify type
    } else {
      // Fallback shape - normalize to PostDTO
      const raw = res as {
        _id?: string;
        id?: string;
        title?: string;
        body?: PortableTextBlock[];
        imageUrl?: string | null;
        primaryImage?: { asset?: { url?: string } };
        excerpt?: string | null;
      };
      post = {
        id: raw.id ?? raw._id ?? '',
        title: raw.title ?? '',
        body: raw.body ?? [],
        imageUrl: raw.imageUrl ?? raw.primaryImage?.asset?.url ?? null,
        excerpt: raw.excerpt ?? null,
      };
      comments = [];
    }
    if (!post || !post.title) {
      notFound();
    }

    // If no comments from API, fetch from Sanity
    if (comments.length === 0 && post.id) {
      try {
        const sanityComments = await sanityClient.fetch<Comment[]>(
          `*[_type == "comment" && post._ref == $postId] | order(_createdAt desc) {
            _id,
            content,
            user->{name}
          }`,
          { postId: post.id }
        );
        comments = sanityComments ?? [];
      } catch (err) {
        // If Sanity fetch fails, just use empty comments
        console.error('Failed to fetch comments from Sanity:', err);
        comments = [];
      }
    }
  } catch (err: unknown) {
    // Use unknown for catch error type
    if (err instanceof Error) {
      const errorWithStatus = err as Error & { status?: number };
      if (errorWithStatus.status === 404 || /POST_NOT_FOUND/.test(String(err.message ?? ''))) {
        notFound();
      }
    }
    throw err;
  }

  const heroUrl: string | null = post.imageUrl ?? null;
  const usingPlaceholder = !heroUrl;
  const src = heroUrl ?? placeholderDataUri(1200, 630);
  const alt = usingPlaceholder ? '' : post.title || '';

  return (
    <>
      <Suspense fallback={<div>Loading header...</div>}>
        <Header />
      </Suspense>
      <Suspense fallback={<div>Loading blog post...</div>}>
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          <h1 className="text-4xl font-extrabold text-center my-8 text-gray-900">{post.title}</h1>
          <div className="relative w-full h-96 mb-8 rounded-lg overflow-hidden shadow-xl">
            <Image
              src={src}
              alt={alt}
              aria-hidden={usingPlaceholder}
              role={usingPlaceholder ? 'presentation' : 'img'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
            />
          </div>
          <article className="prose lg:prose-xl mx-auto">
            <PortableText value={post.body} components={blogPortableTextComponents} />
          </article>
          <section className="mt-12 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Comments</h2>
            <CommentForm postId={post.id} />
            <CommentList comments={comments} />
          </section>
        </div>
      </Suspense>
      <Suspense fallback={<div>Loading footer...</div>}>
        <Footer />
      </Suspense>
    </>
  );
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await props.params;
  const { slug } = resolvedParams;
  let post: PostDTO;
  try {
    const res = await getPostCached(slug);
    if (res && typeof res === 'object' && 'success' in res) {
      const data = (res as { success: boolean; data?: { post: PostDTO; comments: Comment[] } }).data;
      post = data?.post!;
    } else if (res && typeof res === 'object' && 'post' in res) {
      post = res.post as PostDTO;
    } else {
      // Fallback shape - normalize to PostDTO
      const raw = res as {
        _id?: string;
        id?: string;
        title?: string;
        body?: PortableTextBlock[];
        imageUrl?: string | null;
        primaryImage?: { asset?: { url?: string } };
        excerpt?: string | null;
      };
      post = {
        id: raw.id ?? raw._id ?? '',
        title: raw.title ?? '',
        body: raw.body ?? [],
        imageUrl: raw.imageUrl ?? raw.primaryImage?.asset?.url ?? null,
        excerpt: raw.excerpt ?? null,
      };
    }
    if (!post || !post.title) {
      return {
        title: 'Post not found',
      };
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      const errorWithStatus = err as Error & { status?: number };
      if (errorWithStatus.status === 404 || /POST_NOT_FOUND/.test(String(err.message ?? ''))) {
        return {
          title: 'Post not found',
        };
      }
    }
    return {
      title: 'Blog',
    };
  }

  const metadata: Metadata = {
    title: post.title,
    description: post.excerpt ?? undefined,
  };

  // Add OpenGraph and Twitter metadata if image is present
  if (post.imageUrl) {
    const { getBaseUrl } = await import('@/lib/absolute-url');
    const base = await getBaseUrl();
    const absoluteImageUrl = post.imageUrl.startsWith('http')
      ? post.imageUrl
      : `${base}${post.imageUrl}`;

    metadata.openGraph = {
      images: [{ url: absoluteImageUrl }],
    };
    metadata.twitter = {
      card: 'summary_large_image',
      images: [absoluteImageUrl],
    };
  } else {
    // No image - use summary card
    metadata.twitter = {
      card: 'summary',
      images: undefined,
    };
    metadata.openGraph = {
      images: undefined,
    };
  }

  return metadata;
}

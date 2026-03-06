import { PortableText } from '@portabletext/react';
import type { PortableTextBlock } from '@portabletext/types';
import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { blogPortableTextComponents } from '@/components/blog/portableTextComponents';
import CommentForm from '@/components/CommentForm';
import CommentList from '@/components/CommentList';
import { PageLayoutServer } from '@/components/layout/PageLayoutServer';
import { client as sanityClient } from '@/lib/sanity/client';
import { getPostCached } from './data';

type Comment = { _id: string; content: string; user?: { name?: string } | null };

type PostDTO = {
  id: string;
  title: string;
  body: PortableTextBlock[];
  imageUrl?: string | null;
  excerpt?: string | null;
};

function placeholderDataUri(width = 1200, height = 630) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#f3f4f6'/><stop offset='1' stop-color='#e5e7eb'/></linearGradient></defs><rect width='100%' height='100%' fill='url(#g)'/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function loadPost(slug: string): Promise<{ post: PostDTO; comments: Comment[] }> {
  let post: PostDTO;
  let comments: Comment[];

  try {
    const response = await getPostCached(slug);

    if (response && typeof response === 'object' && 'success' in response) {
      const data = (
        response as { success: boolean; data?: { post: PostDTO; comments?: Comment[] } }
      ).data;
      post = data?.post ?? ({} as PostDTO);
      comments = data?.comments ?? [];
    } else if (
      response &&
      typeof response === 'object' &&
      'post' in response &&
      'comments' in response
    ) {
      post = response.post as PostDTO;
      comments = response.comments as Comment[];
    } else {
      const raw = response as {
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

    if (comments.length === 0 && post.id) {
      try {
        comments =
          (await sanityClient.fetch<Comment[]>(
            `*[_type == "comment" && post._ref == $postId] | order(_createdAt desc) {
              _id,
              content,
              user->{name}
            }`,
            { postId: post.id }
          )) ?? [];
      } catch {
        comments = [];
      }
    }

    return { post, comments };
  } catch (error: unknown) {
    if (error instanceof Error) {
      const errorWithStatus = error as Error & { status?: number };
      if (errorWithStatus.status === 404 || /POST_NOT_FOUND/.test(String(error.message ?? ''))) {
        notFound();
      }
    }
    throw error;
  }
}

export default async function BlogPostPage(props: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await props.params;
  const { post, comments } = await loadPost(slug);

  const heroUrl = post.imageUrl ?? null;
  const usingPlaceholder = !heroUrl;
  const src = heroUrl ?? placeholderDataUri(1200, 630);
  const alt = usingPlaceholder ? '' : post.title || '';

  return (
    <PageLayoutServer>
      <div className="relative overflow-hidden bg-neo-secondary px-4 py-12 sm:py-14">
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-25"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, var(--neo-border) 2px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="container relative z-10 mx-auto max-w-4xl">
          <article
            className="border-4 border-neo-border bg-neo-surface p-5 md:p-8"
            style={{ boxShadow: '12px 12px 0px 0px var(--neo-shadow)' }}
          >
            <div className="mb-4 inline-block border-2 border-neo-border bg-neo-primary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-[3px_3px_0_0] shadow-neo-shadow">
              Blog Post
            </div>
            <h1 className="heading-xl text-neo-border">{post.title}</h1>

            <div className="relative mt-6 h-64 overflow-hidden border-4 border-neo-border bg-neo-secondary/20 md:h-96">
              <Image
                src={src}
                alt={alt}
                aria-hidden={usingPlaceholder}
                role={usingPlaceholder ? 'presentation' : 'img'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 900px"
                priority
              />
            </div>

            <div className="prose prose-neutral mt-8 max-w-none prose-headings:font-black prose-headings:text-neo-border prose-a:text-neo-primary prose-strong:text-neo-border">
              <PortableText value={post.body} components={blogPortableTextComponents} />
            </div>
          </article>

          <section
            className="mt-8 border-4 border-neo-border bg-neo-surface p-5 md:p-8"
            style={{ boxShadow: '12px 12px 0px 0px var(--neo-shadow)' }}
          >
            <h2 className="heading-lg mb-4">Comments</h2>
            <CommentForm postId={post.id} />
            <CommentList comments={comments} />
          </section>
        </div>
      </div>
    </PageLayoutServer>
  );
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;

  try {
    const { post } = await loadPost(slug);

    const metadata: Metadata = {
      title: post.title,
      description: post.excerpt ?? undefined,
    };

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
      metadata.twitter = {
        card: 'summary',
        images: undefined,
      };
      metadata.openGraph = {
        images: undefined,
      };
    }

    return metadata;
  } catch (error: unknown) {
    if (error instanceof Error) {
      const errorWithStatus = error as Error & { status?: number };
      if (
        errorWithStatus.status === 404 ||
        /POST_NOT_FOUND|NEXT_NOT_FOUND/.test(String(error.message ?? ''))
      ) {
        return { title: 'Post not found' };
      }
    }

    return { title: 'Blog' };
  }
}

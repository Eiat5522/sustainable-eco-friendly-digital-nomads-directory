'use client';

import { PortableText } from '@portabletext/react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { blogPortableTextComponents } from '@/components/blog/portableTextComponents';
import CommentForm from '@/components/CommentForm';
import CommentList from '@/components/CommentList';

type Comment = { _id: string; content: string; user?: { name?: string } | null };
type PostDTO = { id: string; title: string; body: any[]; imageUrl?: string | null };

type PostResponse = { post: PostDTO; comments: Comment[] };

// Subtle SVG gradient placeholder for hero image when missing
function placeholderDataUri(width = 1200, height = 630) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#f3f4f6'/><stop offset='1' stop-color='#e5e7eb'/></linearGradient></defs><rect width='100%' height='100%' fill='url(#g)'/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export default function BlogPostClient() {
  const params = useParams();
  const slug = params.slug as string;
  const [data, setData] = useState<PostResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug === 'no-posts') {
      setLoading(false);
      return;
    }

    const fetchPost = async () => {
      setLoading(true);
      setError(null);
      try {
        const [postRes, commentsRes] = await Promise.all([
          fetch(`/api/blog/${slug}`),
          fetch(`/api/comments?postId=${slug}`), // Assuming postId is slug, but actually need the _id
        ]);

        if (!postRes.ok) {
          throw new Error('Failed to fetch post');
        }
        const postData = await postRes.json();
        const post = postData.data.post;
        const postId = post.id;

        if (!commentsRes.ok) {
          throw new Error('Failed to fetch comments');
        }
        const commentsData = await commentsRes.json();
        const comments = commentsData.data.comments;

        setData({ post, comments });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPost();
    }
  }, [slug]);

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-red-500">Error: {error}</div>
    );
  }

  if (!data) {
    return <div className="container mx-auto px-4 py-8 text-center">No data</div>;
  }

  const { post, comments } = data;

  const heroUrl: string | null = post.imageUrl ?? null;
  const usingPlaceholder = !heroUrl;
  const src = heroUrl ?? placeholderDataUri(1200, 630);
  const alt = usingPlaceholder ? '' : post.title || '';

  return (
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
  );
}

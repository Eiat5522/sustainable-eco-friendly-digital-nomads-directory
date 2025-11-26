import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { groq } from 'next-sanity';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { getBaseUrl } from '@/lib/absolute-url';
import { client } from '@/lib/sanity/client';
import BlogPostClient from './BlogPostClient';

export default function BlogPostPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="container mx-auto px-4 py-8 text-center">Loading post...</div>}>
        <BlogPostClient />
      </Suspense>
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
  
  const post = await client().fetch(
    groq`*[_type == "post" && slug.current == $slug][0]{
      title,
      excerpt,
      "imageUrl": primaryImage.asset->url
    }`,
    { slug }
  );

  if (!post) {
    return { title: 'Post not found' };
  }

  const { title, excerpt, imageUrl } = post;

  const absoluteImage = imageUrl?.startsWith('http')
    ? imageUrl
    : imageUrl
      ? new URL(imageUrl, base).toString()
      : undefined;

  return {
    title: title || 'Blog',
    description: excerpt || undefined,
    openGraph: {
      title: title || 'Blog',
      description: excerpt || undefined,
      type: 'article',
      url: new URL(`/blog/${slug}`, base).toString(),
      images: absoluteImage ? [{ url: absoluteImage }] : undefined,
    },
    twitter: {
      card: absoluteImage ? 'summary_large_image' : 'summary',
      title: title || 'Blog',
      description: excerpt || undefined,
      images: absoluteImage ? [absoluteImage] : undefined,
    },
  };
}

export async function generateStaticParams() {
  const posts = await client().fetch(groq`*[_type == "post" && defined(slug.current)]{ "slug": slug.current }`);
  if (!posts || posts.length === 0) {
    return [{ slug: 'no-posts' }];
  }
  return posts.map((post: { slug: string }) => ({
    slug: post.slug,
  }));
}

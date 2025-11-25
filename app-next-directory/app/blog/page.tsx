import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { getPosts, type BlogApiResponse } from './data';
import BlogPageClient from './BlogPageClient';

export const metadata: Metadata = {
  title: "The Nomad's Chronicle – Blog",
  description: 'Stories, tips, and sustainability insights for digital nomads.',
};

export default async function BlogPage({
  searchParams,
}: Readonly<{ searchParams?: { page?: string; limit?: string; tag?: string; search?: string } }>) {
  // Support Next 14 (sync) and Next 15 (async) searchParams
  const sp = await Promise.resolve((searchParams ?? {}) as Record<string, string>);
  const { page, limit, tag, search } = sp;
  const { posts, pagination } = await getPosts({ page, limit, tag, search });

  return (
    <>
      <Header />
      <Suspense fallback={<div className="h-screen rounded-lg bg-muted animate-pulse" role="status" aria-label="Loading blog posts" aria-busy="true" />}>
        <BlogPageClient
          posts={posts}
          pagination={pagination}
          search={search}
          tag={tag}
          limit={limit}
        />
      </Suspense>
      <Footer />
    </>
  );
}

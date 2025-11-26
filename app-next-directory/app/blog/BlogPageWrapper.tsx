'use client';

import dynamic from 'next/dynamic';

const BlogPageClient = dynamic(() => import('./BlogPageClient'), { ssr: false });

export default function BlogPageWrapper() {
  return <BlogPageClient />;
}

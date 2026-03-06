import type { Metadata } from 'next';
import { PageLayoutServer } from '@/components/layout/PageLayoutServer';
import { BlogPostsList } from './BlogPostsList';

export const metadata: Metadata = {
  title: "The Nomad's Chronicle - Blog",
  description: 'Stories, tips, and sustainability insights for digital nomads.',
};

export default async function BlogPage(
  props: Readonly<{
    searchParams?: Promise<{ page?: string; limit?: string; tag?: string; search?: string }>;
  }>
) {
  const searchParams = (await props.searchParams) ?? {};

  return (
    <PageLayoutServer>
      <BlogPostsList searchParams={searchParams} />
    </PageLayoutServer>
  );
}

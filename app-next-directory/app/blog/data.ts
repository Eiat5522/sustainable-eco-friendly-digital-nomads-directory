import { cache } from 'react';
import { client } from '@/lib/sanity/client';
import { groq } from 'next-sanity';

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  tags?: string[];
  imageUrl?: string | null;
};

export type BlogApiResponse = {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPage: number | null;
    prevPage: number | null;
  };
  filters: { tag: string | null; search: string | null };
};

export const getPosts = cache(async (params: {
  page?: string;
  limit?: string;
  tag?: string;
  search?: string;
}): Promise<BlogApiResponse> => {
  const page = parseInt(params.page || '1', 10);
  const limit = parseInt(params.limit || '10', 10);
  const start = (page - 1) * limit;
  const end = start + limit;

  const filters = [
    `_type == "post"`,
    params.tag && `"${params.tag}" in tags`,
    params.search && `title match "${params.search}*" || excerpt match "${params.search}*"`,
  ].filter(Boolean).join(' && ');

  const posts = await client().fetch(
    groq`*[${filters}] | order(publishedAt desc) [${start}...${end}] {
      "id": _id,
      title,
      "slug": slug.current,
      excerpt,
      tags,
      "imageUrl": primaryImage.asset->url
    }`
  );

  const totalCount = await client().fetch(groq`count(*[${filters}])`);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    posts,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    },
    filters: { tag: params.tag ?? null, search: params.search ?? null },
  };
});


import { Suspense } from 'react';

async function getPost(slug: string) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/blog/${slug}`, { next: { revalidate: 60 } });
  if (!res.ok) {
    throw new Error('Failed to fetch post');
  }
  const post = await res.json();
  return post.data;
}

async function PostContent({ slug }: { slug: string }) {
  const post = await getPost(slug);

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}

export default function PostPage({ params }: { params: { slug: string } }) {
  return (
    <div>
      <Suspense fallback={<div>Loading post...</div>}>
        <PostContent slug={params.slug} />
      </Suspense>
    </div>
  );
}

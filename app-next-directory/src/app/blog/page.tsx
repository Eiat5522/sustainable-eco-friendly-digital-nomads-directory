import { Suspense } from 'react';
import Link from 'next/link';

async function getPosts() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  // This fetch call will be cached by Next.js
  const res = await fetch(`${baseUrl}/api/blog`, { next: { revalidate: 60 } });
  if (!res.ok) {
    throw new Error('Failed to fetch posts');
  }
  const data = await res.json();
  return data.posts;
}

interface Post {
  _id: string;
  title: string;
  excerpt: string;
  slug: {
    current: string;
  };
}

async function BlogPosts() {
  const posts = await getPosts();

  return (
    <ul>
      {posts.map((post: Post) => (
        <li key={post._id}>
          <Link href={`/blog/${post.slug.current}`}>
            <h2>{post.title}</h2>
          </Link>
          <p>{post.excerpt}</p>
        </li>
      ))}
    </ul>
  );
}

export default function BlogPage() {
  return (
    <div>
      <h1>Blog</h1>
      <Suspense fallback={<div>Loading posts...</div>}>
        <BlogPosts />
      </Suspense>
    </div>
  );
}

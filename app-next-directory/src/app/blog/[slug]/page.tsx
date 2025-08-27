
import { PortableText } from '@portabletext/react';
import { client } from '@/lib/sanity/client';
import { groq } from 'next-sanity';
import CommentForm from '@/components/CommentForm';
import CommentList from '@/components/CommentList';

async function getPost(slug: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/blog/${slug}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch post');
  }
  return res.json();
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const { post, comments } = await getPost(params.slug);

  return (
    <div className="container mx-auto px-4 py-8">
      <article className="prose lg:prose-xl max-w-none">
        <h1 className="text-5xl font-extrabold text-center mb-12 text-gray-900">{post.title}</h1>
        <div className="bg-white border-4 border-black rounded-lg shadow-lg p-8">
          <PortableText value={post.body} />
        </div>
      </article>
      <div className="mt-16">
        <h2 className="text-4xl font-bold mb-8 text-gray-800">Comments</h2>
        <CommentList comments={comments} />
        <CommentForm postId={post._id} />
      </div>
    </div>
  );
}

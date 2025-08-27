
import Link from 'next/link';

async function getPosts() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/blog`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch posts');
  }
  return res.json();
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-5xl font-extrabold text-center mb-12 text-gray-900">The Nomad's Chronicle</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post: any) => (
          <Link key={post._id} href={`/blog/${post.slug.current}`}>
            <div className="block p-6 bg-white border-4 border-black rounded-lg shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 ease-in-out">
              <h2 className="text-3xl font-bold mb-2 text-gray-800">{post.title}</h2>
              <p className="text-gray-600">{post.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

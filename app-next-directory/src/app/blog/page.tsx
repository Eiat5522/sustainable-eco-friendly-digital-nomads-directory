
import Link from 'next/link';

type Post = {
  _id: string;
  title: string;
  excerpt?: string | null;
  slug: { current: string };
};

async function getPosts(): Promise<Post[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error('Missing env NEXT_PUBLIC_API_URL');
  }
  const url = new URL('/api/blog', baseUrl).toString();
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch posts: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) {
    throw new Error('Invalid posts payload: expected an array');
  }
  return data as Post[];
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

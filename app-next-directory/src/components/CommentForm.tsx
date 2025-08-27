
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function CommentForm({ postId }: { postId: string }) {
  const { data: session } = useSession();
  const [content, setContent] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session) {
      router.push('/api/auth/signin');
      return;
    }

    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, postId }),
    });

    if (res.ok) {
      setContent('');
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment..."
        className="w-full p-4 bg-white border-4 border-black rounded-lg shadow-lg focus:outline-none focus:ring-4 focus:ring-yellow-400 transition-all duration-300 ease-in-out"
        rows={4}
        required
      />
      <button
        type="submit"
        className="mt-4 px-8 py-4 bg-yellow-400 text-black font-bold text-lg border-4 border-black rounded-lg shadow-lg hover:bg-yellow-500 focus:outline-none focus:ring-4 focus:ring-yellow-400 transition-all duration-300 ease-in-out"
      >
        Submit Comment
      </button>
    </form>
  );
}

'use client';

import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function CommentForm({ postId }: Readonly<{ postId: string }>) {
  const { data: session } = useSession();
  const [content, setContent] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (status === 'loading') return;

    const trimmed = content.trim();
    if (!trimmed) {
      setContent('');
      return;
    }

    if (!session) {
      await signIn(undefined, { callbackUrl: window.location.href });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed, postId }),
      });

      if (res.status === 401) {
        await signIn(undefined, { callbackUrl: window.location.href });
        return;
      }

      if (res.ok) {
        setContent('');
        router.refresh();
      } else {
        console.error('Failed to submit comment', await res.text());
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <label htmlFor="comment" className="sr-only">Comment</label>
      <textarea
        id="comment"
        name="content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment..."
        className="w-full p-4 bg-white border-4 border-black rounded-lg shadow-lg focus:outline-none focus:ring-4 focus:ring-yellow-400 transition-all duration-300 ease-in-out"
        rows={4}
        maxLength={2000}
        disabled={isSubmitting}
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

'use client';

import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function CommentForm({ postId }: Readonly<{ postId: string }>) {
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (status === 'loading' || isSubmitting) return; // keep guard
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
      setError(null);
      
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed, postId }),
      });

      if (res.status === 401) {
        await signIn(undefined, { callbackUrl: window.location.href });
        return;
      }

      if (res.status === 403) {
        setError('You do not have permission to submit comments.');
        return;
      }

      if (res.ok) {
        setContent('');
        setSubmitted(true);
        router.refresh();
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to submit comment');
        console.error(`Failed to submit comment: ${res.status} ${res.statusText}`, await res.text());
      }
    } catch (err) {
      console.error('Failed to submit comment', err);
      setError('Failed to submit comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <label htmlFor="comment" className="sr-only">Comment</label>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

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
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        Submit Comment
      </button>
      {submitted && (
        <p className="mt-3 text-sm text-gray-600">Thanks! Your comment was submitted and awaits approval.</p>
      )}
    </form>
  );
}

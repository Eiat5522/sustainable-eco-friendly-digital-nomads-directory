'use client';

import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { useState } from 'react';
import { jsonPostOptions } from '@/lib/http/request';
import { structuredLogger } from '@/lib/logger';

export const resolveCallbackUrl = (loc?: { href?: string | null }) => {
  try {
    const href = (loc ?? globalThis?.location)?.href;
    if (typeof href === 'string' && href.length > 0) {
      return href;
    }
  } catch (_error) {
    // Ignore environment navigation issues and fall back to login route
  }

  return '/auth/login';
};

export default function CommentForm({ postId }: Readonly<{ postId: string }>): React.JSX.Element {
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();
  const handleSignIn = () => {
    void signIn(undefined, { callbackUrl: resolveCallbackUrl() });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmed = content.trim();
    if (!trimmed) {
      setContent('');
      return;
    }

    if (!session?.user?.id) {
      handleSignIn();
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const res = await fetch('/api/comments', jsonPostOptions({ content: trimmed, postId }));

      if (res.status === 401) {
        handleSignIn();
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
        const errorText = await res.text();
        let resolvedMessage: string | null = null;

        if (errorText) {
          try {
            const errorData = JSON.parse(errorText);
            if (errorData && typeof errorData === 'object' && 'error' in errorData) {
              const candidate = (errorData as { error?: string }).error;
              if (typeof candidate === 'string' && candidate.trim().length > 0) {
                resolvedMessage = candidate;
              }
            }
          } catch {
            // Failed to parse JSON response - log the error with status and body
            structuredLogger.error(
              `Failed to submit comment: ${res.status} ${res.statusText}`,
              undefined,
              { component: 'comments' }
            );
          }
        }

        setError(resolvedMessage ?? 'Failed to submit comment');
      }
    } catch (err) {
      setError('Failed to submit comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  if (status === 'loading') {
    return (
      <div className="mt-8" aria-busy="true">
        <div className="h-32 w-full rounded-lg border-4 border-dashed border-gray-200 animate-pulse" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mt-8 p-6 text-center bg-gray-50 border-4 border-dashed border-gray-300 rounded-lg">
        <p className="text-lg font-semibold text-gray-700">Sign in to join the conversation.</p>
        <p className="mt-2 text-sm text-gray-600">Log in to share your thoughts on this post.</p>
        <button
          type="button"
          onClick={handleSignIn}
          className="mt-4 px-6 py-3 bg-yellow-400 text-black font-semibold border-4 border-black rounded-lg shadow-lg hover:bg-yellow-500 focus:outline-none focus:ring-4 focus:ring-yellow-400 transition-all duration-300 ease-in-out"
        >
          Sign In to Comment
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <label htmlFor="comment" className="sr-only">
        Comment
      </label>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <textarea
        id="comment"
        name="content"
        value={content}
        onChange={e => setContent(e.target.value)}
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
        <p className="mt-3 text-sm text-gray-600">
          Thanks! Your comment was submitted and awaits approval.
        </p>
      )}
    </form>
  );
}

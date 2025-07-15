'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from "@auth/nextjs/react";
import { urlFor } from '@/lib/sanity/client';
import { PortableText } from '@portabletext/react';

interface BlogPost {
  _id: string;
  title: string;
  slug: { current: string };
  mainImage?: any;
  publishedAt: string;
  excerpt?: string;
  body?: any[];
  tags?: string[];
  authorName?: string;
  authorImage?: any;
  authorBio?: string;
  readingTime?: number;
  viewCount?: number;
  relatedPosts?: any[];
}

interface Comment {
  _id: string;
  content: string;
  createdAt: string;
  userName: string;
  userImage?: string;
  approved: boolean;
}

interface BlogResponse {
  success: boolean;
  data: BlogPost;
}

export default function BlogPostPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (params?.slug) {
      fetchBlogPost(params.slug as string);
      fetchComments(params.slug as string);
    }
  }, [params?.slug]);

  const fetchBlogPost = async (slug: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/blog/${slug}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch blog post');
      }

      const data: BlogResponse = await response.json();
      
      if (data.success) {
        setPost(data.data);
      } else {
        throw new Error('Blog post not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (slug: string) => {
    try {
      const response = await fetch(`/api/comments?postSlug=${slug}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setComments(data.data.comments || []);
        }
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session) {
      alert('Please sign in to leave a comment');
      return;
    }

    if (!commentText.trim()) {
      alert('Please enter a comment');
      return;
    }

    try {
      setSubmittingComment(true);
      
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: post?._id,
          content: commentText,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Comment submitted successfully! It will be reviewed before being published.');
        setCommentText('');
        // Refresh comments after submission
        if (params?.slug) {
          fetchComments(params.slug as string);
        }
      } else {
        throw new Error(data.error?.message || 'Failed to submit comment');
      }
      
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Portable Text components for rich text rendering
  const portableTextComponents = {
    types: {
      image: ({ value }: any) => (
        <div className="my-8">
          <Image
            src={urlFor(value).width(800).height(400).url()}
            alt={value.alt || 'Blog image'}
            width={800}
            height={400}
            className="rounded-lg object-contain max-w-full h-auto"
          />
          {value.caption && (
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
              {value.caption}
            </p>
          )}
        </div>
      ),
    },
    block: {
      h1: ({ children }: any) => (
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
          {children}
        </h1>
      ),
      h2: ({ children }: any) => (
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-6 mb-3">
          {children}
        </h2>
      ),
      h3: ({ children }: any) => (
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-4 mb-2">
          {children}
        </h3>
      ),
      normal: ({ children }: any) => (
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
          {children}
        </p>
      ),
    },
    marks: {
      link: ({ children, value }: any) => (
        <a
          href={value.href}
          className="text-green-600 dark:text-green-400 hover:underline"
          target={value.blank ? '_blank' : undefined}
          rel={value.blank ? 'noopener noreferrer' : undefined}
        >
          {children}
        </a>
      ),
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading blog post...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Blog post not found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error || 'The blog post you are looking for does not exist.'}
            </p>
            <Link
              href="/blog"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Back to Blog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Link href="/" className="hover:text-green-600 dark:hover:text-green-400">
              Home
            </Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-green-600 dark:hover:text-green-400">
              Blog
            </Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-white">{post.title}</span>
          </div>
        </nav>

        {/* Article */}
        <article className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Featured Image */}
          {post.mainImage && (
            <div className="relative h-64 md:h-96 w-full overflow-hidden">
              <Image
                src={urlFor(post.mainImage).width(1200).height(600).url()}
                alt={post.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 67vw"
                className="object-contain"
              />
            </div>
          )}

          <div className="p-8">
            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-block bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm px-3 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              {post.title}
            </h1>

            {/* Meta Information */}
            <div className="flex items-center justify-between mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                {post.authorImage && (
                  <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                    <Image
                      src={urlFor(post.authorImage).width(48).height(48).url()}
                      alt={post.authorName || 'Author'}
                      width={48}
                      height={48}
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {post.authorName || 'Anonymous'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(post.publishedAt)}
                  </p>
                </div>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                {post.readingTime && <span>{post.readingTime} min read</span>}
                {post.viewCount && <span className="ml-4">{post.viewCount} views</span>}
              </div>
            </div>

            {/* Content */}
            <div className="prose prose-lg max-w-none dark:prose-invert">
              {post.body && post.body.length > 0 ? (
                <PortableText
                  value={post.body}
                  components={portableTextComponents}
                />
              ) : (
                <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  <p>No content available for this blog post.</p>
                </div>
              )}
            </div>
          </div>
        </article>

        {/* Comments Section */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Comments ({comments.length})
          </h3>

          {/* Comment Form */}
          {session ? (
            <form onSubmit={handleCommentSubmit} className="mb-8">
              <div className="mb-4">
                <label
                  htmlFor="comment"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Leave a comment
                </label>
                <textarea
                  id="comment"
                  rows={4}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Share your thoughts..."
                  disabled={submittingComment}
                />
              </div>
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
              >
                {submittingComment ? 'Submitting...' : 'Post Comment'}
              </button>
            </form>
          ) : (
            <div className="mb-8 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300">
                Please{' '}
                <Link href="/auth/signin" className="text-green-600 dark:text-green-400 hover:underline">
                  sign in
                </Link>{' '}
                to leave a comment.
              </p>
            </div>
          )}

          {/* Comments List */}
          {comments.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">💬</div>
              <p className="text-gray-600 dark:text-gray-400">
                No comments yet. Be the first to share your thoughts!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => (
                <div
                  key={comment._id}
                  className="flex space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  {comment.userImage && (
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={comment.userImage}
                        alt={comment.userName}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {comment.userName}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related Posts */}
        {post.relatedPosts && post.relatedPosts.length > 0 && (
          <div className="mt-12">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Related Posts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {post.relatedPosts.map((relatedPost) => (
                <article
                  key={relatedPost._id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  {relatedPost.mainImage && (
                    <div className="relative h-32 w-full overflow-hidden">
                      <Image
                        src={urlFor(relatedPost.mainImage).width(300).height(150).url()}
                        alt={relatedPost.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                        className="object-contain"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      <Link
                        href={`/blog/${relatedPost.slug.current}`}
                        className="hover:text-green-600 dark:hover:text-green-400 transition-colors"
                      >
                        {relatedPost.title}
                      </Link>
                    </h4>
                    {relatedPost.excerpt && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {relatedPost.excerpt}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

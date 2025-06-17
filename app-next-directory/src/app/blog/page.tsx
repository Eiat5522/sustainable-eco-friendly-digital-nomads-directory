'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { urlFor } from '@/lib/sanity/client';

interface BlogPost {
  _id: string;
  title: string;
  slug: { current: string };
  mainImage?: any;
  publishedAt: string;
  excerpt?: string;
  tags?: string[];
  authorName?: string;
  authorImage?: any;
  readingTime?: number;
}

interface BlogResponse {
  success: boolean;
  data: {
    posts: BlogPost[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchBlogPosts(currentPage);
  }, [currentPage]);

  const fetchBlogPosts = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/blog?page=${page}&limit=6`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch blog posts');
      }

      const data: BlogResponse = await response.json();
      
      if (data.success) {
        setPosts(data.data.posts);
        setPagination(data.data.pagination);
      } else {
        throw new Error('Failed to load blog posts');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading blog posts...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Oops! Something went wrong
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => fetchBlogPosts(currentPage)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Sustainable Travel Blog
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Discover eco-friendly destinations, sustainable travel tips, and stories from digital nomads around the world.
          </p>
        </div>

        {/* Blog Posts Grid */}
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No blog posts yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Check back soon for our latest sustainable travel content!
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {posts.map((post) => (
                <article
                  key={post._id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  {/* Featured Image */}
                  {post.mainImage && (
                    <div className="relative h-48 w-full overflow-hidden">
                      <Image
                        src={urlFor(post.mainImage).width(400).height(200).url()}
                        alt={post.title}
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}

                  <div className="p-6">
                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="inline-block bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs px-2 py-1 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Title */}
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2">
                      <Link 
                        href={`/blog/${post.slug.current}`}
                        className="hover:text-green-600 dark:hover:text-green-400 transition-colors"
                      >
                        {post.title}
                      </Link>
                    </h2>

                    {/* Excerpt */}
                    {post.excerpt && (
                      <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}

                    {/* Meta Information */}
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        {post.authorImage && (
                          <div className="w-6 h-6 rounded-full overflow-hidden mr-2">
                            <Image
                              src={urlFor(post.authorImage).width(24).height(24).url()}
                              alt={post.authorName || 'Author'}
                              width={24}
                              height={24}
                              className="object-cover"
                            />
                          </div>
                        )}
                        <span>{post.authorName || 'Anonymous'}</span>
                      </div>

                      <div className="flex items-center space-x-3">
                        {post.readingTime && (
                          <span>{post.readingTime} min read</span>
                        )}
                        <span>{formatDate(post.publishedAt)}</span>
                      </div>
                    </div>

                    {/* Read More Button */}
                    <div className="mt-4">
                      <Link
                        href={`/blog/${post.slug.current}`}
                        className="inline-flex items-center text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
                      >
                        Read more
                        <svg
                          className="ml-1 w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4">
                <button
                  onClick={() => setCurrentPage(pagination.prevPage)}
                  disabled={!pagination.hasPrevPage}
                  className={`px-4 py-2 rounded-lg border ${
                    pagination.hasPrevPage
                      ? 'border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900'
                      : 'border-gray-300 text-gray-400 cursor-not-allowed'
                  } transition-colors`}
                >
                  Previous
                </button>

                <span className="text-gray-600 dark:text-gray-400">
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(pagination.nextPage)}
                  disabled={!pagination.hasNextPage}
                  className={`px-4 py-2 rounded-lg border ${
                    pagination.hasNextPage
                      ? 'border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900'
                      : 'border-gray-300 text-gray-400 cursor-not-allowed'
                  } transition-colors`}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

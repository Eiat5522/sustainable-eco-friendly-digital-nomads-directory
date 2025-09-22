'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { NeoCard, NeoCardHeader, NeoCardTitle, NeoCardContent } from '@/components/ui/neo-card';
import { NeoButton } from '@/components/ui/neo-button';
import { StarRating } from '@/components/ui/StarRating';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { getCurrentHref } from '@/utils/navigation';

interface Review {
  id: string;
  rating: number;
  comment: string;
  user: {
    name: string;
    image?: string;
  };
  createdAt: string;
}

interface ReviewsSectionProps {
  reviews: Review[];
  listingId: string;
  isSignedIn?: boolean;
}

export const canSubmitReview = (rating: number, comment: string) => {
  return rating > 0 && comment.trim().length > 0;
};

interface SubmitReviewOptions {
  review: { rating: number; comment: string };
  listingId: string;
  fetcher: typeof fetch;
}

type SubmitReviewResult =
  | { type: 'success' }
  | { type: 'unauthorized' }
  | { type: 'forbidden' }
  | { type: 'conflict' }
  | { type: 'error'; message: string };

export const submitReview = async ({ review, listingId, fetcher }: SubmitReviewOptions): Promise<SubmitReviewResult> => {
  const trimmedComment = review.comment.trim();

  if (!canSubmitReview(review.rating, trimmedComment)) {
    return { type: 'error', message: 'Please provide a rating and comment.' };
  }

  const response = await fetcher('/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating: review.rating, comment: trimmedComment, listingId }),
  });

  if (response.status === 401) {
    return { type: 'unauthorized' };
  }

  if (response.status === 403) {
    return { type: 'forbidden' };
  }

  if (response.status === 409) {
    return { type: 'conflict' };
  }

  if (response.ok) {
    await response.json().catch(() => null);
    return { type: 'success' };
  }

  let message = 'Failed to submit review';

  try {
    const errorData = await response.json();
    if (errorData && typeof errorData.error === 'string' && errorData.error.trim().length > 0) {
      message = errorData.error;
    }
  } catch (error) {
    // Ignore JSON parsing issues and fall back to the generic message
  }

  return { type: 'error', message };
};

export function ReviewsSection({ reviews, listingId, isSignedIn = false }: ReviewsSectionProps) {
  const [newReview, setNewReview] = useState({ rating: 0, comment: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState<string>('');
  const router = useRouter();

  const handleSubmitReview = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await submitReview({
        review: { rating: newReview.rating, comment: newReview.comment },
        listingId,
        fetcher: fetch,
      });

      switch (result.type) {
        case 'unauthorized': {
          const cb = callbackUrl || '/';
          router.push(`/auth/login?callbackUrl=${encodeURIComponent(cb)}`);
          return;
        }
        case 'forbidden':
          setError('You do not have permission to submit reviews.');
          return;
        case 'conflict':
          setError('You have already reviewed this listing.');
          return;
        case 'success':
          setNewReview({ rating: 0, comment: '' });
          setSubmitted(true);
          router.refresh();
          return;
        case 'error':
          setError(result.message);
          return;
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
      setError('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    setCallbackUrl(getCurrentHref());
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  return (
    <NeoCard variant="elevated" className="mb-8">
      <NeoCardHeader>
        <div className="flex items-center justify-between">
          <NeoCardTitle>Reviews ({reviews.length})</NeoCardTitle>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <StarRating rating={averageRating} size={20} />
              <span className="body-md text-neo-text-secondary">
                {averageRating.toFixed(1)} average
              </span>
            </div>
          )}
        </div>
      </NeoCardHeader>

      <NeoCardContent>
        {/* Review Form for Signed-in Users */}
        {isSignedIn && (
          <div className="mb-6 p-4 bg-neo-surface border-2 border-neo-border rounded-lg">
            <h3 className="heading-sm mb-4">Add Your Review</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {submitted && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                Thank you! Your review has been submitted and is pending approval.
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Rating</label>
              <StarRating
                rating={newReview.rating}
                interactive
                onRatingChange={(rating) => setNewReview(prev => ({ ...prev, rating }))}
                size={24}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Comment</label>
              <Textarea
                value={newReview.comment}
                onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Share your experience..."
                className="neo-input"
                rows={4}
                maxLength={2000}
                disabled={isSubmitting}
              />
            </div>

            <NeoButton
              onClick={handleSubmitReview}
              disabled={!canSubmitReview(newReview.rating, newReview.comment) || isSubmitting}
              className="w-full md:w-auto"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </NeoButton>
          </div>
        )}

        {/* Sign-in Prompt for Non-authenticated Users */}
        {!isSignedIn && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
            <p className="body-md text-gray-600 mb-3">Sign in to leave a review</p>
            <Link href={callbackUrl ? `/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/auth/login'}>
              <NeoButton variant="outline" size="sm">
                Sign In
              </NeoButton>
            </Link>
          </div>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <p className="body-lg text-neo-text-secondary">No reviews yet</p>
            <p className="body-sm text-neo-text-secondary mt-1">
              Be the first to share your experience!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review, index) => (
              <div key={review.id}>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {review.user.image ? (
                      <Image
                        src={review.user.image}
                        alt={review.user.name}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-neo-primary rounded-full flex items-center justify-center text-white font-medium">
                        {review.user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-neo-text-primary">
                        {review.user.name}
                      </h4>
                      <StarRating rating={review.rating} size={16} />
                      <span className="text-sm text-neo-text-secondary">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                    
                    <p className="body-md text-neo-text-secondary">
                      {review.comment}
                    </p>
                  </div>
                </div>

                {index < reviews.length - 1 && <Separator className="mt-6" />}
              </div>
            ))}
          </div>
        )}
      </NeoCardContent>
    </NeoCard>
  );
}

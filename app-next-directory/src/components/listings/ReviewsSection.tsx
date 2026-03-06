'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { NeoButton } from '@/components/ui/neo-button';
import { NeoCard, NeoCardContent, NeoCardHeader, NeoCardTitle } from '@/components/ui/neo-card';
import { StarRating } from '@/components/ui/StarRating';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { jsonPostOptions } from '@/lib/http/request';
import { structuredLogger } from '@/lib/logger';
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
  status: 'pending' | 'approved';
}

interface ReviewsSectionProps {
  reviews: Review[];
  listingId: string;
  isSignedIn?: boolean;
  userId?: string;
}

export const canSubmitReview = (rating: number, comment: string) => {
  return rating > 0 && comment.trim().length > 0;
};

interface SubmittedReviewSummary {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  status: 'pending' | 'approved';
  user: {
    name: string;
    image?: string;
  };
}

interface SubmitReviewOptions {
  review: { rating: number; comment: string };

  listingId: string;

  fetcher: typeof fetch;
}

interface SubmitReviewPayload {
  id?: string;

  rating?: number;

  comment?: string;

  approved?: boolean;

  createdAt?: string;

  user?: {
    name?: string;

    image?: string;
  };
}

type SubmitReviewResult =
  | { type: 'success'; review?: SubmitReviewPayload | null }
  | { type: 'unauthorized' }
  | { type: 'forbidden' }
  | { type: 'conflict' }
  | { type: 'error'; message: string };

export const submitReview = async ({
  review,
  listingId,
  fetcher,
}: SubmitReviewOptions): Promise<SubmitReviewResult> => {
  const trimmedComment = review.comment.trim();

  if (!canSubmitReview(review.rating, trimmedComment)) {
    return { type: 'error', message: 'Please provide a rating and comment.' };
  }

  const response = await fetcher(
    '/api/reviews',
    jsonPostOptions({
      rating: review.rating,
      comment: trimmedComment,
      listingId,
    })
  );

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
    let parsed: SubmitReviewPayload | null = null;

    try {
      const data = await response.json();

      if (data && typeof data === 'object') {
        const maybePayload =
          (data as { data?: unknown }).data && typeof (data as { data?: unknown }).data === 'object'
            ? (data as { data: unknown }).data
            : data;

        if (maybePayload && typeof maybePayload === 'object') {
          parsed = maybePayload as SubmitReviewPayload;
        }
      }
    } catch (_error) {
      // Ignore JSON parsing issues and treat as success without payload
    }

    return { type: 'success', review: parsed };
  }

  let message = 'Failed to submit review';

  try {
    const errorData = await response.json();

    if (errorData && typeof errorData.error === 'string' && errorData.error.trim().length > 0) {
      message = errorData.error;
    }
  } catch (_error) {
    // Ignore JSON parsing issues and fall back to the generic message
  }

  return { type: 'error', message };
};

export function ReviewsSection({
  reviews,
  listingId,
  isSignedIn = false,
  userId: _userId,
}: ReviewsSectionProps): React.JSX.Element {
  const [newReview, setNewReview] = useState({ rating: 0, comment: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submittedReview, setSubmittedReview] = useState<SubmittedReviewSummary | null>(null);
  const [callbackUrl, setCallbackUrl] = useState<string>('');
  const router = useRouter();

  const handleSubmitReview = async () => {
    setIsSubmitting(true);
    setError(null);
    setSubmitted(false);

    try {
      const preparedReview = {
        rating: newReview.rating,
        comment: newReview.comment.trim(),
      };

      const result = await submitReview({
        review: preparedReview,
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
          setSubmittedReview(() => {
            const payload = result.review;
            const now = new Date().toISOString();
            const id =
              typeof payload?.id === 'string' && payload.id.trim().length > 0
                ? payload.id
                : `pending-${Date.now()}`;
            const rating =
              typeof payload?.rating === 'number' ? payload.rating : preparedReview.rating;
            const comment =
              typeof payload?.comment === 'string' && payload.comment.trim().length > 0
                ? payload.comment
                : preparedReview.comment;
            const createdAt =
              typeof payload?.createdAt === 'string' && payload.createdAt.length > 0
                ? payload.createdAt
                : now;
            const status: 'pending' | 'approved' = payload?.approved ? 'approved' : 'pending';
            const userName =
              typeof payload?.user?.name === 'string' && payload.user.name.trim().length > 0
                ? payload.user.name.trim()
                : 'You';
            const userImage =
              typeof payload?.user?.image === 'string' && payload.user.image.length > 0
                ? payload.user.image
                : undefined;

            return {
              id,
              rating,
              comment,
              createdAt,
              status,
              user: {
                name: userName,
                image: userImage,
              },
            };
          });
          router.refresh();
          return;
        case 'error':
          setError(result.message);
          return;
      }
    } catch (err) {
      structuredLogger.error('Failed to submit review', err, { component: 'reviews' });
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
      day: 'numeric',
    });
  };

  const { approvedReviews, pendingReviews } = useMemo(() => {
    const approved = reviews.filter(review => review.status === 'approved');
    const pending = reviews.filter(review => review.status === 'pending');
    return { approvedReviews: approved, pendingReviews: pending };
  }, [reviews]);

  const pendingQueue = useMemo(() => {
    if (!submittedReview || submittedReview.status !== 'pending') {
      return pendingReviews;
    }
    const exists = pendingReviews.some(r => r.id === submittedReview.id);
    return exists ? pendingReviews : [submittedReview, ...pendingReviews];
  }, [pendingReviews, submittedReview]);

  const averageRating =
    approvedReviews.length > 0
      ? approvedReviews.reduce((sum, review) => sum + review.rating, 0) / approvedReviews.length
      : 0;

  return (
    <NeoCard variant="elevated" className="mb-8">
      <NeoCardHeader>
        <div className="flex items-center justify-between">
          <NeoCardTitle>Reviews ({approvedReviews.length})</NeoCardTitle>
          {approvedReviews.length > 0 && (
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
              <div
                className="mb-4 rounded-lg border-2 border-red-500/60 bg-red-500/10 p-3 text-sm text-red-700"
                data-testid="review-error-message"
                role="alert"
              >
                {error}
              </div>
            )}

            {submitted && (
              <div
                className="mb-4 rounded-lg border-2 border-neo-success/50 bg-neo-success/15 p-3 text-sm text-neo-success"
                data-testid="review-success-message"
                role="status"
              >
                <p>Thank you! Your review has been submitted and is pending approval.</p>
                {submittedReview && (
                  <div className="mt-2 space-y-1" data-testid="submitted-review-details">
                    <p className="font-medium" data-testid="submitted-review-status">
                      {submittedReview.status === 'approved'
                        ? 'Approved and now visible to the community.'
                        : 'Pending approval'}
                    </p>
                    <p className="text-neo-text-secondary" data-testid="submitted-review-comment">
                      {submittedReview.comment}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Rating</label>
              <StarRating
                rating={newReview.rating}
                interactive
                onRatingChange={rating => setNewReview(prev => ({ ...prev, rating }))}
                size={24}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Comment</label>
              <Textarea
                value={newReview.comment}
                onChange={e => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Share your experience..."
                className="neo-input"
                rows={4}
                maxLength={2000}
                disabled={isSubmitting}
                data-testid="review-comment-field"
              />
            </div>

            <NeoButton
              onClick={handleSubmitReview}
              disabled={!canSubmitReview(newReview.rating, newReview.comment) || isSubmitting}
              className="w-full md:w-auto"
              data-testid="submit-review-button"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </NeoButton>
          </div>
        )}

        {/* Sign-in Prompt for Non-authenticated Users */}
        {!isSignedIn && (
          <div className="mb-6 rounded-lg border-2 border-neo-border bg-neo-secondary/20 p-4 text-center">
            <p className="body-md mb-3 text-neo-text-secondary">Sign in to leave a review</p>
            <Link
              href={
                callbackUrl
                  ? `/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
                  : '/auth/login'
              }
            >
              <NeoButton variant="outline" size="sm">
                Sign In
              </NeoButton>
            </Link>
          </div>
        )}

        {/* Pending Reviews */}
        {pendingQueue.length > 0 && (
          <div className="mb-8 rounded-lg border-2 border-neo-accent/50 bg-neo-accent/15 p-4">
            <h3 className="heading-sm mb-2">Your review is awaiting moderation</h3>
            <p className="body-sm mb-4 text-neo-text-secondary">
              Once approved, it will appear in the public reviews list.
            </p>
            <div className="space-y-4">
              {pendingQueue.map((review, index) => (
                <div
                  key={review.id}
                  className="rounded-lg border border-neo-border bg-neo-surface p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-neo-text-primary">
                      {review.user.name || 'You'}
                    </h4>
                    <StarRating rating={review.rating} size={16} />
                    <span className="text-sm text-neo-text-secondary">
                      {formatDate(review.createdAt)}
                    </span>
                    <span className="ml-auto text-xs font-semibold uppercase tracking-wide text-neo-accent">
                      Pending
                    </span>
                  </div>
                  <p className="body-sm text-neo-text-secondary">{review.comment}</p>
                  {index < pendingQueue.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews List */}
        {approvedReviews.length === 0 ? (
          <div className="text-center py-8">
            <p className="body-lg text-neo-text-secondary">No reviews yet</p>
            <p className="body-sm text-neo-text-secondary mt-1">
              Be the first to share your experience!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {approvedReviews.map((review, index) => (
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
                      <h4 className="font-medium text-neo-text-primary">{review.user.name}</h4>
                      <StarRating rating={review.rating} size={16} />
                      <span className="text-sm text-neo-text-secondary">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>

                    <p className="body-md text-neo-text-secondary">{review.comment}</p>
                  </div>
                </div>

                {index < approvedReviews.length - 1 && <Separator className="mt-6" />}
              </div>
            ))}
          </div>
        )}
      </NeoCardContent>
    </NeoCard>
  );
}

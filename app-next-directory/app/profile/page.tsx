'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  NeoCard,
  NeoCardContent,
  NeoCardDescription,
  NeoCardHeader,
  NeoCardTitle,
} from '@/components/ui/neo-card';
import { NeoBadge } from '@/components/ui/neo-badge';
import { NeoButton } from '@/components/ui/neo-button';
import { Heart, Loader2, MapPin, MessageSquare, Star, Edit } from 'lucide-react';
import { ProfileEditForm } from '@/components/profile/ProfileEditForm';
import {
  normaliseFavorite,
  normaliseOwnerReviews,
  formatDate,
  type FavoriteListing,
  type OwnerListingReviews,
  type FavoritesResponse,
  type OwnerReviewsResponse,
} from './utils';

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const isAuthenticated = status === 'authenticated';
  const displayName = session?.user?.name ?? session?.user?.email ?? 'Your account';
  const email = session?.user?.email ?? undefined;
  const role = session?.user?.role ?? 'user';

  const [isEditing, setIsEditing] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteListing[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [favoritesError, setFavoritesError] = useState<string | null>(null);

  const [ownerListings, setOwnerListings] = useState<OwnerListingReviews[]>([]);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [ownerError, setOwnerError] = useState<string | null>(null);

  const handleEditSuccess = async () => {
    try {
      // Refresh session to get updated name
      await update();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to refresh session:', error);
      // TODO: Show toast notification
      alert('Profile updated successfully. Please refresh the page to see changes.');
      setIsEditing(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const controller = new AbortController();
    const loadFavorites = async () => {
      setFavoritesLoading(true);
      setFavoritesError(null);
      try {
        const res = await fetch('/api/user/favorites', { signal: controller.signal });
        if (!res.ok) {
          throw new Error('Unable to load favorites');
        }
        const data = (await res.json()) as FavoritesResponse;
        const parsed = (data.favorites ?? [])
          .map(normaliseFavorite)
          .filter((favorite): favorite is FavoriteListing => Boolean(favorite));
        setFavorites(parsed);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setFavoritesError('We could not load your favorites right now. Please try again later.');
        }
      } finally {
        setFavoritesLoading(false);
      }
    };

    loadFavorites();
    return () => {
      controller.abort();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || role !== 'venueOwner') return;
    const controller = new AbortController();
    const loadOwnerReviews = async () => {
      setOwnerLoading(true);
      setOwnerError(null);
      try {
        const res = await fetch('/api/user/reviews', { signal: controller.signal });
        if (!res.ok) {
          if (res.status === 404 || res.status === 204) {
            setOwnerListings([]);
            return;
          }
          const payload = await res.json().catch(() => ({}));
          const errorMessage = typeof payload?.error === 'string' ? payload.error : 'Unable to load reviews';
          throw new Error(errorMessage);
        }
        const data = (await res.json()) as OwnerReviewsResponse;
        setOwnerListings(normaliseOwnerReviews(data));
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setOwnerError('We could not load reviews for your listings. Please try again later.');
        }
      } finally {
        setOwnerLoading(false);
      }
    };

    loadOwnerReviews();
    return () => {
      controller.abort();
    };
  }, [isAuthenticated, role]);

  const initials = useMemo(() => {
    const source = session?.user?.name ?? session?.user?.email ?? '';
    if (!source) return 'U';
    return source
      .split(' ')
      .map((part) => part.trim().charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  }, [session?.user?.name, session?.user?.email]);

  const favoriteDateFormatter = useMemo(
    () => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }),
    []
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 space-y-12" data-testid="user-profile-page">
        {status === 'loading' ? (
          <section className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-neo-primary" aria-hidden="true" />
            <p className="mt-4 text-sm text-neo-text-secondary">Loading your profile…</p>
          </section>
        ) : !isAuthenticated ? (
          <section className="max-w-3xl mx-auto">
            <NeoCard variant="elevated" className="bg-white/90">
              <NeoCardHeader>
                <NeoCardTitle>Sign in to view your profile</NeoCardTitle>
                <NeoCardDescription>
                  Access your saved favorites and keep track of your sustainable venues.
                </NeoCardDescription>
              </NeoCardHeader>
              <NeoCardContent className="pt-0">
                <NeoButton asChild variant="secondary">
                  <Link href="/auth?mode=signin">Go to sign in</Link>
                </NeoButton>
              </NeoCardContent>
            </NeoCard>
          </section>
        ) : (
          <>
            <section aria-labelledby="profile-overview">
              <NeoCard variant="elevated" className="bg-white/95">
                <NeoCardContent className="flex flex-col gap-6 md:flex-row md:items-center">
                  <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-neo-border bg-neo-surface">
                    {session?.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt={`${displayName} avatar`}
                        width={80}
                        height={80}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-neo-secondary text-lg font-semibold text-neo-text-primary">
                        {initials}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 id="profile-overview" className="heading-lg text-neo-text-primary">
                        {displayName}
                      </h1>
                      <NeoBadge variant="secondary" size="sm" aria-label={`Account role: ${role}`}>
                        {role === 'venueOwner' ? 'Venue Owner' : role.charAt(0).toUpperCase() + role.slice(1)}
                      </NeoBadge>
                    </div>
                    {email && (
                      <p className="text-sm text-neo-text-secondary">
                        <span className="font-semibold">Email:</span> {email}
                      </p>
                    )}
                    <p className="text-sm text-neo-text-secondary">
                      Keep exploring sustainable venues and manage the places you love.
                    </p>
                    <div className="pt-2">
                      <NeoButton
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsEditing(!isEditing)}
                        data-testid="edit-profile-button"
                      >
                        <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
                        {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                      </NeoButton>
                    </div>
                  </div>
                </NeoCardContent>
              </NeoCard>
            </section>

            {isEditing && (
              <section>
                <ProfileEditForm
                  currentName={session?.user?.name || ''}
                  onSuccess={handleEditSuccess}
                  onCancel={() => setIsEditing(false)}
                />
              </section>
            )}

            <section id="favorites" aria-labelledby="favorites-heading" data-testid="profile-favorites" className="space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 id="favorites-heading" className="heading-md text-neo-text-primary flex items-center gap-2">
                    <Heart className="h-5 w-5 text-neo-primary" aria-hidden="true" />
                    Favorite listings
                  </h2>
                  <p className="text-sm text-neo-text-secondary">
                    A quick view of the sustainable venues you&apos;ve saved.
                  </p>
                </div>
                <NeoButton asChild variant="secondary">
                  <Link href="/search">Discover more venues</Link>
                </NeoButton>
              </div>

              {favoritesLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-live="polite">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-48 animate-pulse rounded-xl border-2 border-dashed border-neo-border/60 bg-white/60"
                    />
                  ))}
                </div>
              ) : favoritesError ? (
                <NeoCard variant="flat" className="bg-rose-50 border-rose-200">
                  <NeoCardHeader className="pb-2">
                    <NeoCardTitle className="text-base text-rose-700">We couldn&apos;t load your favorites</NeoCardTitle>
                  </NeoCardHeader>
                  <NeoCardContent className="pt-0 text-sm text-rose-700">{favoritesError}</NeoCardContent>
                </NeoCard>
              ) : favorites.length === 0 ? (
                <NeoCard variant="flat" className="bg-white/90">
                  <NeoCardContent className="flex flex-col items-start gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-neo-text-primary">You haven&apos;t saved any venues yet.</p>
                      <p className="text-sm text-neo-text-secondary">
                        Explore eco-friendly spaces and tap the heart icon to save your favorites.
                      </p>
                    </div>
                    <NeoButton asChild variant="accent">
                      <Link href="/search">Start exploring</Link>
                    </NeoButton>
                  </NeoCardContent>
                </NeoCard>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {favorites.map((favorite) => (
                    <NeoCard key={favorite.id} variant="flat" className="bg-white/95" data-testid="favorite-item">
                      <NeoCardContent className="space-y-4">
                        <div className="relative h-40 w-full overflow-hidden rounded-xl border-2 border-neo-border bg-neo-surface">
                          {favorite.imageUrl ? (
                            <Image
                              src={favorite.imageUrl}
                              alt={`${favorite.name} preview`}
                              fill
                              sizes="(max-width: 768px) 100vw, 33vw"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-neo-secondary/60 text-neo-text-primary">
                              <MapPin className="h-8 w-8" aria-hidden="true" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold text-neo-text-primary">{favorite.name}</h3>
                          {favorite.city && (
                            <p className="text-sm text-neo-text-secondary flex items-center gap-1">
                              <MapPin className="h-4 w-4" aria-hidden="true" />
                              {favorite.city}
                            </p>
                          )}
                          {favorite.createdAt && (
                            <p className="text-xs text-neo-text-secondary">
                              Saved on {favoriteDateFormatter.format(new Date(favorite.createdAt))}
                            </p>
                          )}
                        </div>
                        <NeoButton asChild variant="secondary" size="sm">
                          <Link href={`/listings/${favorite.slug}`}>View listing</Link>
                        </NeoButton>
                      </NeoCardContent>
                    </NeoCard>
                  ))}
                </div>
              )}
            </section>

            {role === 'venueOwner' && (
              <section
                id="owner-reviews"
                aria-labelledby="owner-reviews-heading"
                data-testid="profile-owner-reviews"
                className="space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 id="owner-reviews-heading" className="heading-md text-neo-text-primary flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-neo-primary" aria-hidden="true" />
                      Reviews for your venues
                    </h2>
                    <p className="text-sm text-neo-text-secondary">
                      Keep an eye on what guests love about your eco-friendly spaces.
                    </p>
                  </div>
                </div>

                {ownerLoading ? (
                  <div className="space-y-4" role="status" aria-live="polite">
                    {Array.from({ length: 2 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-40 animate-pulse rounded-xl border-2 border-dashed border-neo-border/60 bg-white/60"
                      />
                    ))}
                  </div>
                ) : ownerError ? (
                  <NeoCard variant="flat" className="bg-rose-50 border-rose-200">
                    <NeoCardHeader className="pb-2">
                      <NeoCardTitle className="text-base text-rose-700">{ownerError}</NeoCardTitle>
                    </NeoCardHeader>
                  </NeoCard>
                ) : ownerListings.length === 0 ? (
                  <NeoCard variant="flat" className="bg-white/90">
                    <NeoCardContent className="py-6 text-sm text-neo-text-secondary">
                      You don&apos;t have any published listings with reviews yet. Listings you create will appear here once guests
                      share their experiences.
                    </NeoCardContent>
                  </NeoCard>
                ) : (
                  <div className="space-y-6">
                    {ownerListings.map((listing) => {
                      const averageRating =
                        listing.reviews.length > 0
                          ? listing.reviews.reduce((sum, review) => sum + review.rating, 0) / listing.reviews.length
                          : null;

                      return (
                        <NeoCard key={listing.slug} variant="flat" className="bg-white/95">
                          <NeoCardHeader className="space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <NeoCardTitle className="text-lg text-neo-text-primary">{listing.name}</NeoCardTitle>
                                <Link
                                  href={`/listings/${listing.slug}`}
                                  className="text-sm font-medium text-neo-primary hover:underline"
                                >
                                  View public listing
                                </Link>
                              </div>
                              {averageRating ? (
                                <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                                  <Star className="h-4 w-4" aria-hidden="true" />
                                  {averageRating.toFixed(1)}
                                  <span className="text-xs font-normal text-emerald-600">
                                    ({listing.reviews.length} review{listing.reviews.length === 1 ? '' : 's'})
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs font-medium text-neo-text-secondary">
                                  No reviews yet
                                </span>
                              )}
                            </div>
                          </NeoCardHeader>
                          <NeoCardContent className="space-y-4">
                            {listing.reviews.length === 0 ? (
                              <p className="text-sm text-neo-text-secondary">
                                No reviews yet. Encourage your guests to share their experience!
                              </p>
                            ) : (
                              <ul className="space-y-4">
                                {listing.reviews.map((review) => (
                                  <li key={review.id} className="rounded-xl border border-neo-border/70 bg-white/80 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 overflow-hidden rounded-full bg-neo-secondary/40">
                                          {review.reviewerImage ? (
                                            <Image
                                              src={review.reviewerImage}
                                              alt={`${review.reviewerName} avatar`}
                                              width={40}
                                              height={40}
                                              className="h-full w-full object-cover"
                                            />
                                          ) : (
                                            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-neo-text-primary">
                                              {review.reviewerName.charAt(0).toUpperCase()}
                                            </div>
                                          )}
                                        </div>
                                        <div>
                                          <p className="text-sm font-semibold text-neo-text-primary">{review.reviewerName}</p>
                                          <p className="text-xs text-neo-text-secondary">{formatDate(review.createdAt)}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-sm font-semibold text-emerald-700">
                                        <Star className="h-4 w-4" aria-hidden="true" />
                                        {review.rating.toFixed(1)}
                                      </div>
                                    </div>
                                    {review.comment && (
                                      <p className="mt-3 text-sm text-neo-text-secondary">{review.comment}</p>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </NeoCardContent>
                        </NeoCard>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

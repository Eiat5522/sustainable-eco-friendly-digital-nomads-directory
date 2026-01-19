'use client';

import { Edit, MessageSquare, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { ProfileEditForm } from '@/components/profile/ProfileEditForm';
import { NeoBadge } from '@/components/ui/neo-badge';
import { NeoButton } from '@/components/ui/neo-button';
import {
  NeoCard,
  NeoCardContent,
  NeoCardDescription,
  NeoCardHeader,
  NeoCardTitle,
} from '@/components/ui/neo-card';
import { useCachedUserProfile } from '@/hooks/useCachedUserProfile';
import type { OwnerListingReviews } from '@/lib/data-access/profile.dal';
import type { UserRole } from '@/types/auth';
import type {
  DashboardTimeSeriesPointDTO,
  RegularUserDashboardDTO,
  UserDashboardPayloadDTO,
  VenueOwnerDashboardDTO,
} from '@/types/dto';
import { formatDate } from './utils';

type TabKey = 'overview' | 'favourite' | 'listings' | 'monthly';

const NAV_ITEMS: Array<{ id: TabKey; label: string; helper: string }> = [
  { id: 'overview', label: 'Overview', helper: 'Profile & highlights' },
  { id: 'favourite', label: 'Favourite', helper: 'Saved venues & stats' },
  { id: 'listings', label: 'Listings', helper: 'Owner workspace' },
  { id: 'monthly', label: 'Monthly trend', helper: 'Recent performance' },
];

type ProfileClientProps = {
  sessionUser: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: UserRole;
  } | null;
  isAuthenticated: boolean;
  dashboard: UserDashboardPayloadDTO | null;
  dashboardError: string | null;
  ownerReviews: OwnerListingReviews[];
  ownerError: string | null;
};

function isOwnerRole(role: UserRole | undefined): boolean {
  return role === 'venueOwner' || role === 'admin' || role === 'superAdmin';
}

function formatAvgRating(value: number | null): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toFixed(2);
  }
  return '—';
}

function formatCount(value: number | null | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }
  return value.toLocaleString();
}

function DashboardSummaryCard({
  title,
  value,
  helper,
}: {
  title: string;
  value: string;
  helper: string;
}) {
  return (
    <NeoCard className="h-full border-4 border-neo-border bg-white shadow-[6px_6px_0px_0px_rgba(30,41,59,0.35)]">
      <NeoCardHeader>
        <NeoCardTitle className="text-base text-neo-text-secondary">{title}</NeoCardTitle>
      </NeoCardHeader>
      <NeoCardContent className="space-y-2">
        <p className="text-3xl font-semibold text-neo-text-primary">{value}</p>
        <p className="text-sm text-neo-text-secondary">{helper}</p>
      </NeoCardContent>
    </NeoCard>
  );
}

function MonthlyTrendTable({
  rows,
  showViews,
}: {
  rows: DashboardTimeSeriesPointDTO[];
  showViews: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border-4 border-neo-border bg-white/95 shadow-[8px_8px_0px_0px_rgba(15,23,42,0.2)]">
      <table className="min-w-full divide-y-2 divide-neo-border/60 text-left text-sm">
        <thead className="bg-neo-surface/80 text-xs uppercase tracking-wide text-neo-text-secondary">
          <tr>
            <th scope="col" className="px-4 py-3">
              Month
            </th>
            <th scope="col" className="px-4 py-3">
              Reviews
            </th>
            <th scope="col" className="px-4 py-3">
              Avg rating
            </th>
            <th scope="col" className="px-4 py-3">
              Favourites
            </th>
            {showViews && (
              <th scope="col" className="px-4 py-3">
                Monthly views*
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-neo-border/40 bg-white/90">
          {rows.map(month => (
            <tr key={month.month}>
              <td className="px-4 py-3 text-neo-text-primary">{month.label}</td>
              <td className="px-4 py-3">{formatCount(month.reviewCount)}</td>
              <td className="px-4 py-3">{formatAvgRating(month.avgRating)}</td>
              <td className="px-4 py-3">{formatCount(month.favoritesCount)}</td>
              {showViews && <td className="px-4 py-3">{formatCount(month.monthlyViewCount)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ProfileClient({
  sessionUser,
  isAuthenticated,
  dashboard,
  dashboardError,
  ownerReviews,
  ownerError,
}: ProfileClientProps) {
  const role = (sessionUser?.role ?? 'user') as UserRole;
  const ownerRole = isOwnerRole(role);
  const { displayInfo } = useCachedUserProfile(sessionUser, isAuthenticated);
  const displayName = displayInfo.displayName;
  const email = sessionUser?.email ?? undefined;

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [isEditing, setIsEditing] = useState(false);

  const initials = displayInfo.initials;

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    if (tab !== 'overview' && isEditing) {
      setIsEditing(false);
    }
  };

  const handleEditSuccess = async () => {
    setIsEditing(false);
  };

  const renderOwnerReviewsSection = () => (
    <section
      id="owner-reviews"
      aria-labelledby="owner-reviews-heading"
      data-testid="profile-owner-reviews"
      className="space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2
            id="owner-reviews-heading"
            className="heading-md text-neo-text-primary flex items-center gap-2"
          >
            <MessageSquare className="h-5 w-5 text-neo-primary" aria-hidden="true" />
            Reviews for your venues
          </h2>
          <p className="text-sm text-neo-text-secondary">
            Keep an eye on what guests love about your eco-friendly spaces.
          </p>
        </div>
      </div>

      {ownerError ? (
        <NeoCard variant="flat" className="border-4 border-rose-200 bg-rose-50">
          <NeoCardHeader className="pb-2">
            <NeoCardTitle className="text-base text-rose-700">{ownerError}</NeoCardTitle>
          </NeoCardHeader>
        </NeoCard>
      ) : ownerReviews.length === 0 ? (
        <NeoCard variant="flat" className="border-4 border-neo-border bg-white/90">
          <NeoCardContent className="py-6 text-sm text-neo-text-secondary">
            You don&apos;t have any published listings with reviews yet. Listings you create will
            appear here once guests share their experiences.
          </NeoCardContent>
        </NeoCard>
      ) : (
        <div className="space-y-6">
          {ownerReviews.map(listing => {
            const averageRating =
              listing.reviews.length > 0
                ? listing.reviews.reduce((sum, review) => sum + review.rating, 0) /
                  listing.reviews.length
                : null;

            return (
              <NeoCard
                key={listing.slug}
                variant="flat"
                className="border-4 border-neo-border bg-white/95"
              >
                <NeoCardHeader className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <NeoCardTitle className="text-lg text-neo-text-primary">
                        {listing.name}
                      </NeoCardTitle>
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
                      {listing.reviews.map(review => (
                        <li
                          key={review.id}
                          className="rounded-2xl border-2 border-neo-border/70 bg-white/80 p-4"
                        >
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
                                    {(review.reviewerName ?? '?').charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-neo-text-primary">
                                  {review.reviewerName}
                                </p>
                                <p className="text-xs text-neo-text-secondary">
                                  {formatDate(review.createdAt)}
                                </p>
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
  );

  const renderRegularUserDashboard = (data: RegularUserDashboardDTO) => (
    <section aria-labelledby="user-dashboard" className="space-y-8">
      <header className="space-y-2">
        <h2 id="user-dashboard" className="heading-md">
          Your activity snapshot
        </h2>
        <p className="text-sm text-neo-text-secondary">
          Track the favourite listings you have saved and quickly revisit them when planning your
          next trip.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DashboardSummaryCard
          title="Saved favourites"
          value={formatCount(data.metrics.favoritesCount)}
          helper="Listings saved to your collection"
        />
        <DashboardSummaryCard
          title="Reviews written"
          value={formatCount(data.metrics.reviewsWritten)}
          helper="Approved reviews you have contributed"
        />
        <DashboardSummaryCard
          title="Average rating given"
          value={formatAvgRating(data.metrics.avgRatingGiven)}
          helper="Your average review score"
        />
      </div>

      <div className="space-y-4">
        <h3 className="heading-sm">Favourite listings table</h3>
        <div className="overflow-x-auto rounded-2xl border-4 border-neo-border bg-white/95 shadow-[8px_8px_0px_0px_rgba(15,23,42,0.2)]">
          <table className="min-w-full divide-y-2 divide-neo-border/60 text-left text-sm">
            <thead className="bg-neo-surface/80 text-xs uppercase tracking-wide text-neo-text-secondary">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Listing
                </th>
                <th scope="col" className="px-4 py-3">
                  City
                </th>
                <th scope="col" className="px-4 py-3">
                  Saved on
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neo-border/40 bg-white/90">
              {data.favorites.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-neo-text-secondary">
                    You have not saved any listings yet. Explore destinations and tap the heart icon
                    to start a shortlist.
                  </td>
                </tr>
              ) : (
                data.favorites.map(favorite => {
                  const href = favorite.listing.slug
                    ? `/listings/${favorite.listing.slug}`
                    : undefined;
                  return (
                    <tr key={favorite.id}>
                      <td className="px-4 py-4">
                        {href ? (
                          <Link
                            href={href}
                            className="font-medium text-neo-primary hover:underline focus-visible:underline"
                          >
                            {favorite.listing.name}
                          </Link>
                        ) : (
                          <span className="font-medium text-neo-text-primary">
                            {favorite.listing.name}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-neo-text-secondary">
                        {favorite.listing.city ?? '—'}
                      </td>
                      <td className="px-4 py-4 text-neo-text-secondary">
                        {formatDate(favorite.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );

  const renderVenueOwnerDashboard = (data: VenueOwnerDashboardDTO) => (
    <section aria-labelledby="venue-owner-dashboard" className="space-y-10">
      <header className="space-y-2">
        <h2 id="venue-owner-dashboard" className="heading-md">
          Listing performance
        </h2>
        <p className="text-sm text-neo-text-secondary">
          Showing lifetime metrics plus the last {dashboard?.range.months ?? 3} months of trend data
          for your published listings.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardSummaryCard
          title="Average rating"
          value={formatAvgRating(data.totals.avgRating)}
          helper="Lifetime average across managed listings"
        />
        <DashboardSummaryCard
          title="Total reviews"
          value={formatCount(data.totals.reviewCount)}
          helper="All approved reviews submitted"
        />
        <DashboardSummaryCard
          title="Total favourites"
          value={formatCount(data.totals.favoritesCount)}
          helper="Users who saved your listings"
        />
        <DashboardSummaryCard
          title="Views tracked"
          value={formatCount(data.totals.viewCount)}
          helper={
            data.totals.viewCount === null
              ? 'View analytics not yet enabled'
              : 'Current total views captured'
          }
        />
      </div>

      <div className="flex justify-end">
        <Link href="/dashboard/listings">
          <NeoButton>Manage Listings</NeoButton>
        </Link>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="heading-sm">Per-listing snapshot</h3>
          <p className="text-sm text-neo-text-secondary">
            Quick glance at the health of each managed listing.
          </p>
        </div>
        <div className="overflow-x-auto rounded-2xl border-4 border-neo-border bg-white/95 shadow-[8px_8px_0px_0px_rgba(15,23,42,0.2)]">
          <table className="min-w-full divide-y-2 divide-neo-border/60 text-left text-sm">
            <thead className="bg-neo-surface/80 text-xs uppercase tracking-wide text-neo-text-secondary">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Listing
                </th>
                <th scope="col" className="px-4 py-3">
                  City
                </th>
                <th scope="col" className="px-4 py-3">
                  Avg rating
                </th>
                <th scope="col" className="px-4 py-3">
                  Reviews
                </th>
                <th scope="col" className="px-4 py-3">
                  Favourites
                </th>
                <th scope="col" className="px-4 py-3">
                  Views
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neo-border/40 bg-white/90">
              {data.listings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-neo-text-secondary">
                    No listings linked to this account yet.
                  </td>
                </tr>
              ) : (
                data.listings.map(listing => {
                  const href = listing.listing.slug
                    ? `/listings/${listing.listing.slug}`
                    : undefined;
                  return (
                    <tr key={listing.listing.id}>
                      <td className="px-4 py-4">
                        {href ? (
                          <Link
                            href={href}
                            className="font-medium text-neo-primary hover:underline focus-visible:underline"
                          >
                            {listing.listing.name}
                          </Link>
                        ) : (
                          <span className="font-medium text-neo-text-primary">
                            {listing.listing.name}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-neo-text-secondary">
                        {listing.listing.city ?? '—'}
                      </td>
                      <td className="px-4 py-4">{formatAvgRating(listing.summary.avgRating)}</td>
                      <td className="px-4 py-4">{formatCount(listing.summary.reviewCount)}</td>
                      <td className="px-4 py-4">{formatCount(listing.summary.favoritesCount)}</td>
                      <td className="px-4 py-4">{formatCount(listing.summary.viewCount)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {data.notices.length > 0 && (
        <div className="space-y-2 rounded-2xl border-4 border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900 shadow-[6px_6px_0px_0px_rgba(217,119,6,0.25)]">
          {data.notices.map(notice => (
            <p key={notice}>{notice}</p>
          ))}
        </div>
      )}
    </section>
  );

  const renderMonthlyTrendSection = () => {
    if (dashboardError) {
      return (
        <NeoCard variant="flat" className="border-4 border-rose-200 bg-rose-50">
          <NeoCardContent className="text-sm text-rose-700">{dashboardError}</NeoCardContent>
        </NeoCard>
      );
    }

    if (!dashboard) {
      return (
        <NeoCard variant="flat" className="border-4 border-neo-border bg-white/90">
          <NeoCardContent className="text-sm text-neo-text-secondary">
            We don&apos;t have monthly trend data for your account yet. Come back after interacting
            with more listings.
          </NeoCardContent>
        </NeoCard>
      );
    }

    if (dashboard.data.kind === 'venueOwner') {
      return (
        <div className="space-y-4">
          <MonthlyTrendTable rows={dashboard.data.monthlyTotals} showViews />
          <p className="text-xs text-neo-text-tertiary">
            * View analytics populate once monthly tracking is enabled; otherwise the dashboard
            shows — for that period.
          </p>
        </div>
      );
    }

    return <MonthlyTrendTable rows={dashboard.data.monthly} showViews={false} />;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto space-y-12 px-4 py-12" data-testid="user-profile-page">
        {!isAuthenticated ? (
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
                  <Link href="/auth/login">Go to sign in</Link>
                </NeoButton>
              </NeoCardContent>
            </NeoCard>
          </section>
        ) : (
          <section className="space-y-10">
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neo-text-tertiary">
                    Welcome
                  </p>
                  <h1 className="heading-xl text-neo-text-primary">{displayName}</h1>
                  <p className="text-sm text-neo-text-secondary">
                    Manage your profile, saved venues, and performance insights in one place.
                  </p>
                  {dashboard && (
                    <p className="mt-2 text-xs text-neo-text-tertiary">
                      Insights refreshed {new Date(dashboard.generatedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              <nav
                aria-label="Profile navigation"
                className="flex flex-wrap gap-4 rounded-3xl border-4 border-neo-border bg-neo-surface/60 p-4 shadow-[10px_10px_0px_0px_rgba(15,23,42,0.2)]"
              >
                {NAV_ITEMS.map(item => {
                  const isDisabled = item.id === 'listings' && !ownerRole;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleTabChange(item.id)}
                      disabled={isDisabled}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex-1 min-w-[160px] rounded-2xl border-4 px-5 py-4 text-left transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary focus-visible:ring-offset-2 focus-visible:ring-offset-neo-surface ${
                        isActive
                          ? 'border-neo-text-primary bg-neo-primary text-white shadow-[8px_8px_0px_0px_rgba(15,23,42,0.45)]'
                          : 'border-neo-border bg-white text-neo-text-primary shadow-[6px_6px_0px_0px_rgba(15,23,42,0.2)] hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_rgba(15,23,42,0.35)]'
                      } ${isDisabled ? 'cursor-not-allowed opacity-60 hover:translate-y-0 hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,0.2)]' : ''}`}
                    >
                      <span className="block text-sm font-semibold uppercase tracking-wide">
                        {item.label}
                      </span>
                      <span className="mt-1 block text-xs text-neo-text-secondary">
                        {isDisabled ? 'For listing owners' : item.helper}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-8">
                <section aria-labelledby="profile-overview">
                  <NeoCard variant="elevated" className="bg-white/95">
                    <NeoCardContent className="flex flex-col gap-6 md:flex-row md:items-center">
                      <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-neo-border bg-neo-surface">
                        {sessionUser?.image ? (
                          <Image
                            src={sessionUser.image}
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
                          <h2 id="profile-overview" className="heading-lg text-neo-text-primary">
                            {displayName}
                          </h2>
                          <NeoBadge
                            variant="secondary"
                            size="sm"
                            aria-label={`Account role: ${role}`}
                          >
                            {role === 'venueOwner'
                              ? 'Venue Owner'
                              : role.charAt(0).toUpperCase() + role.slice(1)}
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
                            onClick={() => setIsEditing(value => !value)}
                            data-testid="edit-profile-button"
                          >
                            <Edit className="mr-2 h-4 w-4" aria-hidden="true" />
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
                      currentName={sessionUser?.name ?? ''}
                      onSuccess={handleEditSuccess}
                      onCancel={() => setIsEditing(false)}
                    />
                  </section>
                )}
              </div>
            )}

            {activeTab === 'favourite' && (
              <div className="space-y-10">
                <section aria-labelledby="favourite-dashboard" className="space-y-6">
                  <h2 id="favourite-dashboard" className="heading-md">
                    Favourite listing dashboards
                  </h2>
                  {dashboardError ? (
                    <NeoCard variant="flat" className="border-4 border-rose-200 bg-rose-50">
                      <NeoCardContent className="text-sm text-rose-700">
                        {dashboardError}
                      </NeoCardContent>
                    </NeoCard>
                  ) : dashboard && dashboard.data.kind === 'user' ? (
                    renderRegularUserDashboard(dashboard.data)
                  ) : (
                    <NeoCard variant="flat" className="border-4 border-neo-border bg-white/90">
                      <NeoCardContent className="text-sm text-neo-text-secondary">
                        Favourite analytics are available for explorer accounts. As a listing owner
                        you can still manage saved venues above.
                      </NeoCardContent>
                    </NeoCard>
                  )}
                </section>
              </div>
            )}

            {activeTab === 'listings' && (
              <div className="space-y-10">
                {dashboardError && ownerRole ? (
                  <NeoCard variant="flat" className="border-4 border-rose-200 bg-rose-50">
                    <NeoCardContent className="text-sm text-rose-700">
                      {dashboardError}
                    </NeoCardContent>
                  </NeoCard>
                ) : ownerRole && dashboard && dashboard.data.kind === 'venueOwner' ? (
                  renderVenueOwnerDashboard(dashboard.data)
                ) : (
                  <NeoCard variant="flat" className="border-4 border-neo-border bg-white/90">
                    <NeoCardContent className="text-sm text-neo-text-secondary">
                      Listing analytics are available to venue owners. Save eco-friendly venues in
                      your favourites to start building insights.
                    </NeoCardContent>
                  </NeoCard>
                )}

                {ownerRole && renderOwnerReviewsSection()}
              </div>
            )}

            {activeTab === 'monthly' && (
              <div className="space-y-6">
                <header className="space-y-2">
                  <h2 className="heading-md">Monthly trend dashboards</h2>
                  <p className="text-sm text-neo-text-secondary">
                    Visualise how your activity has evolved over the past{' '}
                    {dashboard?.range.months ?? 3} months.
                  </p>
                </header>
                {renderMonthlyTrendSection()}
              </div>
            )}
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

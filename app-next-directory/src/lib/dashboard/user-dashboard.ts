import { client } from '@/lib/sanity/client';
import { ensureSanityUser } from '@/lib/sanity/user';
import type { UserRole } from '@/types/auth';
import type {
  DashboardListingInfoDTO,
  DashboardListingSummaryDTO,
  DashboardTimeSeriesPointDTO,
  RegularUserDashboardDTO,
  UserDashboardFavoriteDTO,
  UserDashboardPayloadDTO,
  VenueOwnerDashboardDTO,
} from '@/types/dto';
import { getLifetimeViewCounts, getMonthlyViewCounts } from '@/lib/metrics/listing-views';

const DEFAULT_MONTHS = 3;
const monthLabelFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

type SessionUser = {
  id: string;
  role: UserRole;
  name?: string | null;
  email?: string | null;
};

type MonthBucket = {
  key: string;
  label: string;
  start: Date;
  end: Date;
};

type ReviewDoc = {
  listingId: string;
  rating: number;
  createdAt: string;
};

type FavoriteDoc = {
  listingId: string;
  createdAt: string;
};

type UserReviewDoc = {
  rating: number;
  createdAt: string;
};

type AnalyticsDoc = {
  listingId: string;
  viewCount?: number | null;
  lastUpdated?: string | null;
};

type ListingInfo = DashboardListingInfoDTO;
type ListingMonthlyMetrics = DashboardTimeSeriesPointDTO;
type ListingDashboardMetrics = DashboardListingSummaryDTO;
type VenueOwnerDashboard = VenueOwnerDashboardDTO;
type FavoriteSummary = UserDashboardFavoriteDTO;
type RegularUserDashboard = RegularUserDashboardDTO;
type DashboardPayload = UserDashboardPayloadDTO;

function createMonthBuckets(monthCount: number, reference: Date): MonthBucket[] {
  const buckets: MonthBucket[] = [];
  const base = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), 1));

  for (let offset = monthCount - 1; offset >= 0; offset -= 1) {
    const start = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - offset, 1));
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    const key = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`;

    buckets.push({
      key,
      label: monthLabelFormatter.format(start),
      start,
      end,
    });
  }

  return buckets;
}

function toISODate(date: Date): string {
  return new Date(date).toISOString();
}

function normaliseAvg(sum: number, count: number): number | null {
  if (count <= 0) return null;
  return Number((sum / count).toFixed(2));
}

function groupByListing<T extends { listingId: string }>(docs: T[]): Map<string, T[]> {
  return docs.reduce((map, doc) => {
    const existing = map.get(doc.listingId) ?? [];
    existing.push(doc);
    map.set(doc.listingId, existing);
    return map;
  }, new Map<string, T[]>());
}

export async function getUserDashboardData(
  sessionUser: SessionUser | null | undefined,
  options: { months?: number } = {},
): Promise<DashboardPayload | null> {
  if (!sessionUser?.id) {
    return null;
  }

  const { id, role, name, email } = sessionUser;
  const months = Math.max(1, options.months ?? DEFAULT_MONTHS);
  const referenceDate = new Date();
  const buckets = createMonthBuckets(months, referenceDate);
  const rangeStart = buckets[0]?.start ?? referenceDate;

  await ensureSanityUser({ id, name: name ?? null, email: email ?? null, role });

  const isVenueOwner = role === 'venueOwner' || role === 'admin';

  if (!isVenueOwner) {
    type RawFavoriteDoc = {
      _id?: string;
      createdAt?: string;
      listing?: {
        _id?: string;
        name?: string;
        slug?: string | { current?: string };
        city?: { name?: string } | string;
      };
    };

    type RawUserReviewDoc = {
      rating?: number;
      createdAt?: string;
    };

    const [favorites, userReviews] = await Promise.all([
      client.fetch<RawFavoriteDoc[]>(
        `*[_type == "userFavorite" && user._ref == $userId] | order(coalesce(createdAt, _createdAt) desc)[0...100]{
          _id,
          "createdAt": coalesce(createdAt, _createdAt),
          "listing": listing->{
            _id,
            name,
            "slug": slug.current,
            "city": city->name
          }
        }`,
        { userId: id },
      ),
      client.fetch<RawUserReviewDoc[]>(
        `*[_type == "review" && user._ref == $userId]{
          rating,
          "createdAt": coalesce(_updatedAt, _createdAt)
        }`,
        { userId: id },
      ),
    ]);

    const normalizedFavorites: FavoriteSummary[] = favorites
      .filter((fav): fav is Required<RawFavoriteDoc> & { listing: { _id: string } } => Boolean(fav?.listing?._id))
      .map((fav) => ({
        id: fav._id ?? fav.listing._id,
        createdAt: fav.createdAt ?? new Date().toISOString(),
        listing: {
          id: fav.listing._id,
          name: fav.listing.name ?? 'Unknown listing',
          slug: typeof fav.listing.slug === 'string' ? fav.listing.slug : fav.listing.slug?.current ?? null,
          city: typeof fav.listing.city === 'string' ? fav.listing.city : fav.listing.city?.name ?? null,
        },
      }));

    const normalizedReviews: UserReviewDoc[] = userReviews
      .filter((review): review is Required<RawUserReviewDoc> => typeof review?.rating === 'number')
      .map((review) => ({
        rating: review.rating ?? 0,
        createdAt: review.createdAt ?? new Date().toISOString(),
      }));

    const totalReviewSum = normalizedReviews.reduce((sum, review) => sum + review.rating, 0);

    const monthlyRegular: ListingMonthlyMetrics[] = buckets.map((bucket) => {
      const monthReviews = normalizedReviews.filter((review) => {
        const createdAt = new Date(review.createdAt);
        return createdAt >= bucket.start && createdAt < bucket.end;
      });
      const monthFavorites = normalizedFavorites.filter((fav) => {
        const createdAt = new Date(fav.createdAt);
        return createdAt >= bucket.start && createdAt < bucket.end;
      });

      const monthReviewSum = monthReviews.reduce((sum, review) => sum + review.rating, 0);

      return {
        month: bucket.key,
        label: bucket.label,
        reviewCount: monthReviews.length,
        avgRating: normaliseAvg(monthReviewSum, monthReviews.length),
        favoritesCount: monthFavorites.length,
        viewCount: null,
      };
    });

    return {
      user: { id, role, name: name ?? null, email: email ?? null },
      generatedAt: toISODate(referenceDate),
      range: {
        months,
        from: toISODate(rangeStart),
        to: toISODate(referenceDate),
      },
      data: {
        kind: 'user',
        favorites: normalizedFavorites,
        metrics: {
          favoritesCount: normalizedFavorites.length,
          reviewsWritten: normalizedReviews.length,
          avgRatingGiven: normaliseAvg(totalReviewSum, normalizedReviews.length),
        },
        monthly: monthlyRegular,
      },
    };
  }

  const userDoc = await client.fetch<{
    ownedListings?: Array<{
      _id: string;
      name?: string;
      slug?: { current?: string };
      city?: { name?: string };
    }>;
  }>(
    `*[_type == "user" && _id == $userId][0]{
      "ownedListings": ownedListings[]->{
        _id,
        name,
        slug,
        city->{ name }
      }
    }`,
    { userId: id },
  );

  const ownedListings = userDoc?.ownedListings ?? [];
  const listingInfos: ListingInfo[] = ownedListings
    .filter((listing): listing is { _id: string; name?: string; slug?: { current?: string }; city?: { name?: string } } => Boolean(listing?._id))
    .map((listing) => ({
      id: listing._id,
      name: listing.name ?? 'Untitled listing',
      slug: listing.slug?.current ?? null,
      city: listing.city?.name ?? null,
    }));

  if (listingInfos.length === 0) {
    return {
      user: { id, role, name: name ?? null, email: email ?? null },
      generatedAt: toISODate(referenceDate),
      range: {
        months,
        from: toISODate(rangeStart),
        to: toISODate(referenceDate),
      },
      data: {
        kind: 'venueOwner',
        listings: [],
        totals: {
          avgRating: null,
          reviewCount: 0,
          favoritesCount: 0,
          viewCount: null,
        },
        monthlyTotals: buckets.map((bucket) => ({
          month: bucket.key,
          label: bucket.label,
          reviewCount: 0,
          avgRating: null,
          favoritesCount: 0,
          viewCount: null,
        })),
        notices: ['No linked listings were found for this account.'],
      },
    };
  }

  const listingIds = listingInfos.map((listing) => listing.id);
  const monthKeys = buckets.map((bucket) => bucket.key);

  const [reviews, favorites, analytics, monthlyViewMetrics, lifetimeViewTotals] = await Promise.all([
    client.fetch<ReviewDoc[]>(
      `*[_type == "review" && listing._ref in $listingIds]{
        "listingId": listing._ref,
        rating,
        "createdAt": coalesce(_updatedAt, _createdAt)
      }`,
      { listingIds },
    ),
    client.fetch<FavoriteDoc[]>(
      `*[_type == "userFavorite" && listing._ref in $listingIds]{
        "listingId": listing._ref,
        "createdAt": coalesce(createdAt, _createdAt)
      }`,
      { listingIds },
    ),
    client.fetch<AnalyticsDoc[]>(
      `*[_type == "listingAnalytics" && listing._ref in $listingIds]{
        "listingId": listing._ref,
        viewCount,
        lastUpdated
      }`,
      { listingIds },
    ),
    getMonthlyViewCounts(listingIds, monthKeys),
    getLifetimeViewCounts(listingIds),
  ]);

  const reviewsSince = reviews.filter((review) => new Date(review.createdAt) >= rangeStart);
  const favoritesSince = favorites.filter((fav) => new Date(fav.createdAt) >= rangeStart);

  const reviewsByListing = groupByListing(reviewsSince);
  const favoritesByListing = groupByListing(favoritesSince);
  const allReviewsByListing = groupByListing(reviews);
  const allFavoritesByListing = groupByListing(favorites);
  const analyticsByListing = new Map<string, AnalyticsDoc>();
  analytics.forEach((doc) => {
    analyticsByListing.set(doc.listingId, doc);
  });

  const monthlyTotalsBase = buckets.map((bucket) => ({
    month: bucket.key,
    label: bucket.label,
    reviewCount: 0,
    favoritesCount: 0,
    viewCount: 0,
  }));
  const monthlyRatingAccumulators = buckets.map(() => ({ sum: 0, count: 0 }));

  let totalReviewSum = 0;
  let totalReviewCount = 0;
  let totalFavoritesCount = 0;
  let totalViewCount = 0;
  let hasViewData = false;
  let hasMonthlyViewData = false;

  if (monthlyViewMetrics.size > 0) {
    hasMonthlyViewData = true;
  }

  const listings: ListingDashboardMetrics[] = listingInfos.map((listing) => {
    const listingReviews = reviewsByListing.get(listing.id) ?? [];
    const recentFavorites = favoritesByListing.get(listing.id) ?? [];
    const lifetimeReviews = allReviewsByListing.get(listing.id) ?? [];
    const lifetimeFavorites = allFavoritesByListing.get(listing.id) ?? [];
    const analyticsDoc = analyticsByListing.get(listing.id);
    const lifetimeViewCount = lifetimeViewTotals.get(listing.id);
    if (typeof lifetimeViewCount === 'number') {
      hasViewData = true;
      totalViewCount += lifetimeViewCount;
    }

    const lifetimeReviewSum = lifetimeReviews.reduce((sum, review) => sum + (review.rating ?? 0), 0);
    const lifetimeReviewCount = lifetimeReviews.length;

    totalReviewSum += lifetimeReviewSum;
    totalReviewCount += lifetimeReviewCount;
    totalFavoritesCount += lifetimeFavorites.length;

    const selectedViewCount =
      typeof lifetimeViewCount === 'number'
        ? lifetimeViewCount
        : typeof analyticsDoc?.viewCount === 'number'
          ? analyticsDoc.viewCount
          : null;
    if (selectedViewCount !== null && typeof lifetimeViewCount !== 'number') {
      totalViewCount += selectedViewCount;
      hasViewData = true;
    }

    const monthlyStats = buckets.map((bucket, index) => {
      const monthReviews = listingReviews.filter((review) => {
        const createdAt = new Date(review.createdAt);
        return createdAt >= bucket.start && createdAt < bucket.end;
      });
      const monthFavorites = recentFavorites.filter((fav) => {
        const createdAt = new Date(fav.createdAt);
        return createdAt >= bucket.start && createdAt < bucket.end;
      });

      const monthReviewSum = monthReviews.reduce((sum, review) => sum + (review.rating ?? 0), 0);
      monthlyTotalsBase[index].reviewCount += monthReviews.length;
      monthlyTotalsBase[index].favoritesCount += monthFavorites.length;
      monthlyRatingAccumulators[index].sum += monthReviewSum;
      monthlyRatingAccumulators[index].count += monthReviews.length;

      const byListingViews = monthlyViewMetrics.get(listing.id);
      const monthViewCount = byListingViews?.get(bucket.key) ?? 0;
      monthlyTotalsBase[index].viewCount += monthViewCount;

      return {
        month: bucket.key,
        label: bucket.label,
        reviewCount: monthReviews.length,
        avgRating: normaliseAvg(monthReviewSum, monthReviews.length),
        favoritesCount: monthFavorites.length,
        viewCount: monthViewCount,
      };
    });

    return {
      listing,
      summary: {
        avgRating: normaliseAvg(lifetimeReviewSum, lifetimeReviewCount),
        reviewCount: lifetimeReviewCount,
        favoritesCount: lifetimeFavorites.length,
        viewCount: selectedViewCount,
      },
      monthly: monthlyStats,
      lastUpdated: analyticsDoc?.lastUpdated ?? null,
    };
  });

  const monthlyTotals = monthlyTotalsBase.map((entry, index) => ({
    ...entry,
    avgRating: normaliseAvg(
      monthlyRatingAccumulators[index].sum,
      monthlyRatingAccumulators[index].count,
    ),
  }));

  const notices: string[] = [];
  if (!hasViewData) {
    notices.push('View analytics are not yet available for these listings.');
  } else if (!hasMonthlyViewData) {
    notices.push('Monthly view breakdown is not yet tracked. Displaying totals only.');
  }

  return {
    user: { id, role, name: name ?? null, email: email ?? null },
    generatedAt: toISODate(referenceDate),
    range: {
      months,
      from: toISODate(rangeStart),
      to: toISODate(referenceDate),
    },
    data: {
      kind: 'venueOwner',
      listings,
      totals: {
        avgRating: normaliseAvg(totalReviewSum, totalReviewCount),
        reviewCount: totalReviewCount,
        favoritesCount: totalFavoritesCount,
        viewCount: hasViewData ? totalViewCount : null,
      },
      monthlyTotals,
      notices,
    },
  };
}

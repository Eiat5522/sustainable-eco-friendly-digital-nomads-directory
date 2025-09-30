import Link from 'next/link';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { NeoCard, NeoCardContent, NeoCardHeader, NeoCardTitle } from '@/components/ui/neo-card';
import { auth } from '@/lib/auth';
import { getUserDashboardData } from '@/lib/dashboard/user-dashboard';
import type {
  RegularUserDashboardDTO,
  UserDashboardPayloadDTO,
  VenueOwnerDashboardDTO,
} from '@/types/dto';
import type { UserRole } from '@/types/auth';

export const metadata: Metadata = {
  title: 'User Dashboard',
  robots: { index: false, follow: false },
};

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

function DashboardSummaryCard({ title, value, helper }: { title: string; value: string; helper: string }) {
  return (
    <NeoCard className="h-full">
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

function VenueOwnerView({ data, range }: { data: VenueOwnerDashboardDTO; range: UserDashboardPayloadDTO['range'] }) {
  return (
    <section aria-labelledby="venue-owner-dashboard" className="space-y-10">
      <header className="space-y-2">
        <h2 id="venue-owner-dashboard" className="heading-lg">Listing performance</h2>
        <p className="text-sm text-neo-text-secondary">
          Showing lifetime metrics plus the last {range.months} months of trend data for your published listings.
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
          helper={data.totals.viewCount === null ? 'View analytics not yet enabled' : 'Current total views captured'}
        />
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="heading-md">Per-listing snapshot</h3>
          <p className="text-sm text-neo-text-secondary">Quick glance at the health of each managed listing.</p>
        </div>
        <div className="overflow-x-auto rounded-lg border border-neo-border/60 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-neo-border/60 text-left text-sm">
            <thead className="bg-neo-surface/80 text-xs uppercase tracking-wide text-neo-text-secondary">
              <tr>
                <th scope="col" className="px-4 py-3">Listing</th>
                <th scope="col" className="px-4 py-3">City</th>
                <th scope="col" className="px-4 py-3">Avg rating</th>
                <th scope="col" className="px-4 py-3">Reviews</th>
                <th scope="col" className="px-4 py-3">Favourites</th>
                <th scope="col" className="px-4 py-3">Views</th>
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
                data.listings.map((listing) => {
                  const href = listing.listing.slug ? `/listings/${listing.listing.slug}` : undefined;
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
                          <span className="font-medium text-neo-text-primary">{listing.listing.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-neo-text-secondary">{listing.listing.city ?? '—'}</td>
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

      <div className="space-y-4">
        <h3 className="heading-md">Monthly trend</h3>
        <div className="overflow-x-auto rounded-lg border border-neo-border/60 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-neo-border/60 text-left text-sm">
            <thead className="bg-neo-surface/80 text-xs uppercase tracking-wide text-neo-text-secondary">
              <tr>
                <th scope="col" className="px-4 py-3">Month</th>
                <th scope="col" className="px-4 py-3">Reviews</th>
                <th scope="col" className="px-4 py-3">Avg rating</th>
                <th scope="col" className="px-4 py-3">Favourites</th>
                <th scope="col" className="px-4 py-3">Monthly views*</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neo-border/40 bg-white/90">
              {data.monthlyTotals.map((month) => (
                <tr key={month.month}>
                  <td className="px-4 py-3 text-neo-text-primary">{month.label}</td>
                  <td className="px-4 py-3">{formatCount(month.reviewCount)}</td>
                  <td className="px-4 py-3">{formatAvgRating(month.avgRating)}</td>
                  <td className="px-4 py-3">{formatCount(month.favoritesCount)}</td>
                  <td className="px-4 py-3">{formatCount(month.monthlyViewCount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-neo-text-tertiary">
          * View analytics populate once monthly tracking is enabled; otherwise the dashboard shows — for that period.
        </p>
      </div>

      {data.notices.length > 0 && (
        <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900">
          {data.notices.map((notice) => (
            <p key={notice}>{notice}</p>
          ))}
        </div>
      )}
    </section>
  );
}

function RegularUserView({ data }: { data: RegularUserDashboardDTO }) {
  return (
    <section aria-labelledby="user-dashboard" className="space-y-8">
      <header className="space-y-2">
        <h2 id="user-dashboard" className="heading-lg">Your activity</h2>
        <p className="text-sm text-neo-text-secondary">
          Track the favourite listings you have saved and quickly revisit them when planning your next trip.
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
        <h3 className="heading-md">Favourite listings</h3>
        <div className="overflow-x-auto rounded-lg border border-neo-border/60 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-neo-border/60 text-left text-sm">
            <thead className="bg-neo-surface/80 text-xs uppercase tracking-wide text-neo-text-secondary">
              <tr>
                <th scope="col" className="px-4 py-3">Listing</th>
                <th scope="col" className="px-4 py-3">City</th>
                <th scope="col" className="px-4 py-3">Saved on</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neo-border/40 bg-white/90">
              {data.favorites.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-neo-text-secondary">
                    You have not saved any listings yet. Explore destinations and tap the heart icon to start a shortlist.
                  </td>
                </tr>
              ) : (
                data.favorites.map((favorite) => {
                  const href = favorite.listing.slug ? `/listings/${favorite.listing.slug}` : undefined;
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
                          <span className="font-medium text-neo-text-primary">{favorite.listing.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-neo-text-secondary">{favorite.listing.city ?? '—'}</td>
                      <td className="px-4 py-4 text-neo-text-secondary">
                        {new Date(favorite.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="heading-md">Monthly trend</h3>
        <div className="overflow-x-auto rounded-lg border border-neo-border/60 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-neo-border/60 text-left text-sm">
            <thead className="bg-neo-surface/80 text-xs uppercase tracking-wide text-neo-text-secondary">
              <tr>
                <th scope="col" className="px-4 py-3">Month</th>
                <th scope="col" className="px-4 py-3">Reviews</th>
                <th scope="col" className="px-4 py-3">Avg rating</th>
                <th scope="col" className="px-4 py-3">Favourites</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neo-border/40 bg-white/90">
              {data.monthly.map((month) => (
                <tr key={month.month}>
                  <td className="px-4 py-3 text-neo-text-primary">{month.label}</td>
                  <td className="px-4 py-3">{formatCount(month.reviewCount)}</td>
                  <td className="px-4 py-3">{formatAvgRating(month.avgRating)}</td>
                  <td className="px-4 py-3">{formatCount(month.favoritesCount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  const sessionUser = session?.user as {
    id?: string;
    role?: UserRole;
    name?: string | null;
    email?: string | null;
  } | undefined;

  if (!sessionUser?.id) {
    redirect(`/auth/login?callbackUrl=${encodeURIComponent('/dashboard')}`);
  }

  const dashboard = await getUserDashboardData(
    {
      id: sessionUser.id,
      role: sessionUser.role ?? 'user',
      name: sessionUser.name ?? null,
      email: sessionUser.email ?? null,
    },
    { months: 3 },
  );

  if (!dashboard) {
    return (
      <main className="container mx-auto px-4 py-16">
        <h1 className="heading-lg">Dashboard</h1>
        <p className="mt-2 text-sm text-neo-text-secondary">We could not load your dashboard data right now. Please try again later.</p>
      </main>
    );
  }

  return (
    <main className="container mx-auto space-y-12 px-4 py-12" data-testid="user-dashboard">
      <header className="space-y-2">
        <h1 className="heading-xl">Dashboard</h1>
        <p className="text-sm text-neo-text-secondary">
          Personalised workspace for tracking your activity inside Digital Nomads Directory.
        </p>
        <p className="text-xs text-neo-text-tertiary">Last generated {new Date(dashboard.generatedAt).toLocaleString()}</p>
      </header>

      {dashboard.data.kind === 'venueOwner' ? (
        <VenueOwnerView data={dashboard.data} range={dashboard.range} />
      ) : (
        <RegularUserView data={dashboard.data} />
      )}
    </main>
  );
}

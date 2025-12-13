import { authOptions } from '@/lib/auth';
import { client } from '@/lib/sanity/client';
import { ApiResponseHandler } from '@/utils/api-response';
import { getServerSession } from 'next-auth/next';
import { NextRequest } from 'next/server';

interface ListingStats {
  totalListings: number;
  publishedListings: number;
  pendingListings: number;
  flaggedListings: number;
  averageRating: number;
  totalViews: number;
}

async function getListingStats(): Promise<ListingStats> {
  try {
    const [
      totalListings,
      publishedListings,
      pendingListings,
      draftListings,
      reviewStats,
      viewStats
    ] = await Promise.all([
      client.fetch(`count(*[_type == "listing"])`),
      client.fetch(`count(*[_type == "listing" && !(_id in path("drafts.**"))])`),
      client.fetch(`count(*[_type == "listing" && _id in path("drafts.**")])`),
      client.fetch(`count(*[_type == "listing" && status == "draft"])`),
      client.fetch(`
        *[_type == "review"] {
          rating
        } | {
          "average": math::avg(@.rating),
          "total": count(@)
        }
      `),
      client.fetch(`
        *[_type == "listingAnalytics"] {
          viewCount
        } | {
          "total": math::sum(@.viewCount)
        }
      `)
    ]);

    return {
      totalListings,
      publishedListings,
      pendingListings: pendingListings + draftListings,
      flaggedListings: 0, // TODO: Implement flagging system
      averageRating: reviewStats?.[0]?.average || 0,
      totalViews: viewStats?.[0]?.total || 0
    };
  } catch (error) {
    console.error('Error fetching listing stats:', error);
    throw error;
  }
}

async function getAdminListings(searchTerm?: string, typeFilter?: string, statusFilter?: string) {
  try {
    let query = `*[_type == "listing"`;
    const filters: string[] = [];

    if (searchTerm) {
      filters.push(`(name match "*${searchTerm}*" || city->name match "*${searchTerm}*")`);
    }

    if (typeFilter && typeFilter !== 'all') {
      filters.push(`category == "${typeFilter}"`);
    }

    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        filters.push(`_id in path("drafts.**")`);
      } else if (statusFilter === 'published') {
        filters.push(`!(_id in path("drafts.**"))`);
      }
    }

    if (filters.length > 0) {
      query += ` && ${filters.join(' && ')}`;
    }

    query += `] | order(_createdAt desc) {
      _id,
      name,
      category,
      "slug": slug.current,
      "status": select(
        _id in path("drafts.**") => "pending",
        "published"
      ),
      "location": {
        "city": city->name,
        "country": city->country
      },
      "rating": coalesce(
        *[_type == "review" && listing._ref == ^._id] {
          rating
        } | math::avg(@.rating),
        0
      ),
      "reviewCount": count(*[_type == "review" && listing._ref == ^._id]),
      "views": coalesce(
        *[_type == "listingAnalytics" && listing._ref == ^._id][0].viewCount,
        0
      ),
      _createdAt,
      _updatedAt,
      "author": {
        "id": author._ref,
        "name": author->name,
        "email": author->email
      },
      sustainabilityScore,
      eco_features,
      amenities,
      price
    }`;

    const listings = await client.fetch(query);
    return listings;
  } catch (error) {
    console.error('Error fetching admin listings:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiResponseHandler.unauthorized();
    }

    if (session.user.role !== 'admin' && session.user.role !== 'superAdmin') {
      return ApiResponseHandler.forbidden();
    }

    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search') || undefined;
    const typeFilter = searchParams.get('type') || 'all';
    const statusFilter = searchParams.get('status') || 'all';
    const statsOnly = searchParams.get('statsOnly') === 'true';

    if (statsOnly) {
      const stats = await getListingStats();
      return ApiResponseHandler.success({ stats }, 'Listing statistics retrieved successfully');
    }

    const [stats, listings] = await Promise.all([
      getListingStats(),
      getAdminListings(searchTerm, typeFilter, statusFilter)
    ]);

    // Transform listings to match the admin page interface
    const transformedListings = listings.map((listing: any) => ({
      id: listing._id,
      title: listing.name,
      type: listing.category,
      status: listing.status,
      location: listing.location,
      rating: Number(listing.rating?.toFixed(1)) || 0,
      reviewCount: listing.reviewCount || 0,
      views: listing.views || 0,
      createdAt: listing._createdAt,
      updatedAt: listing._updatedAt,
      author: listing.author || { id: '', name: 'Unknown', email: '' },
      sustainabilityScore: listing.sustainabilityScore || 0,
      features: listing.eco_features || listing.amenities || [],
      price: listing.price ? {
        amount: listing.price.amount || listing.price.value || 0,
        currency: listing.price.currency || 'USD',
        period: listing.price.period || 'day'
      } : undefined
    }));

    return ApiResponseHandler.success({
      stats,
      listings: transformedListings
    }, 'Admin listings retrieved successfully');
  } catch (error) {
    console.error('Admin listings error:', error);
    return ApiResponseHandler.error('Failed to fetch admin listings', 500);
  }
}

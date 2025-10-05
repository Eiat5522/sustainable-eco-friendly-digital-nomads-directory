import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { client } from '@/lib/sanity/client';
import type { UserRole } from '@/types/auth';

type RouteContext = { params: Promise<Record<string, never>> };

async function getAdminAnalytics() {
  // Get basic counts
  const [userCount, listingCount, reviewCount, pendingModerationCount] = await Promise.all([
    // Total users
    client.fetch(`count(*[_type == "user"])`),

    // Total listings
    client.fetch(`count(*[_type == "listing"])`),

    // Total reviews
    client.fetch(`count(*[_type == "review"])`),

    // Items pending moderation
    client.fetch(`count(*[_type == "moderationStatus" && status == "pending"])`),
  ]);

  // Get recent signups (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const weeklySignups = await client.fetch(
    `count(*[_type == "user" && _createdAt >= $sevenDaysAgo])`,
    { sevenDaysAgo: sevenDaysAgo.toISOString() }
  );

  // Get moderation queue items
  const moderationQueue = await client.fetch(`
    *[_type == "moderationStatus" && status == "pending"] | order(_createdAt desc)[0...10] {
      _id,
      _createdAt,
      status,
      "itemType": item->._type,
      "itemName": item->.name,
      "itemId": item->._id,
      userReports[] {
        reportedBy->{
          name
        },
        reason,
        reportedAt
      }
    }
  `);

  // Get user role distribution
  const userRoles = await client.fetch(`
    *[_type == "user"] {
      role
    }
  `);

  const roleCounts = userRoles.reduce((acc: Record<string, number>, user: { role?: string }) => {
    const role = user.role || 'user';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});

  return {
    overview: {
      totalUsers: userCount,
      totalListings: listingCount,
      totalReviews: reviewCount,
      weeklySignups,
      pendingModeration: pendingModerationCount,
    },
    userRoles: roleCounts,
    moderationQueue: moderationQueue.map((item: any) => ({
      id: item._id,
      itemType: item.itemType,
      itemName: item.itemName || 'Unnamed Item',
      itemId: item.itemId,
      reports: item.userReports?.length || 0,
      lastActivity: item._createdAt,
      status: item.status,
    })),
    generatedAt: new Date().toISOString(),
  };
}

export async function GET(_request: NextRequest, _context: RouteContext) {
  try {
    const session = await auth();
    const sessionUser = session?.user as { role?: UserRole } | undefined;

    if (!sessionUser?.role || sessionUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const analytics = await getAdminAnalytics();
    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Admin analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin analytics' }, { status: 500 });
  }
}

export async function POST(_request: NextRequest, _context: RouteContext) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasFeaturePermission } from '@/types/auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.role || !hasFeaturePermission(session.user.role, 'accessAnalytics')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    await dbConnect();

    // Get current date and calculate date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Aggregate user statistics
    const [
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      newUsersLastMonth,
      usersByRole
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ 
        $or: [
          { emailVerified: { $exists: true, $ne: null } },
          { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
        ]
      }),
      User.countDocuments({ createdAt: { $gte: startOfMonth } }),
      User.countDocuments({ 
        createdAt: { 
          $gte: startOfLastMonth, 
          $lt: endOfLastMonth 
        } 
      }),
      User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Calculate growth percentage
    const growthPercentage = newUsersLastMonth > 0 
      ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth * 100).toFixed(1)
      : newUsersThisMonth > 0 ? 100 : 0;

    // Get user registration trend (last 6 months)
    const userTrend = await User.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Format role distribution
    const roleDistribution = usersByRole.reduce((acc: any, item: any) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    // Mock data for other metrics (replace with real data)
    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        newThisMonth: newUsersThisMonth,
        growthPercentage: parseFloat(growthPercentage),
        roleDistribution
      },
      listings: {
        total: 89, // Replace with actual count
        active: 76,
        pending: 8,
        suspended: 5
      },
      reviews: {
        total: 234, // Replace with actual count
        pending: 23,
        approved: 198,
        rejected: 13
      },
      activity: {
        dailyActiveUsers: Math.floor(activeUsers * 0.3),
        monthlyActiveUsers: activeUsers,
        userTrend: userTrend.map(item => ({
          month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
          users: item.count
        }))
      }
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Admin stats API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
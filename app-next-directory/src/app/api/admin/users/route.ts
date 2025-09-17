import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasFeaturePermission } from '@/types/auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.role || !hasFeaturePermission(session.user.role, 'viewUserProfiles')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';

    // Build search query
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role && role !== 'all') {
      query.role = role;
    }

    // Get users with pagination
    const skip = (page - 1) * limit;
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(query);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.role || !hasFeaturePermission(session.user.role, 'manageUserRoles')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const { name, email, password, role } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Create new user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      role,
      emailVerified: new Date() // Admin-created users are pre-verified
    });

    await user.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    return NextResponse.json({ user: userResponse });
  } catch (error) {
    console.error('Admin create user API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
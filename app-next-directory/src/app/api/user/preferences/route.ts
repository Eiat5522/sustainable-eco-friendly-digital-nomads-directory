import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import UserPreferences from '@/models/UserPreferences';
import { getServerSession } from 'next-auth';
import { NextRequest } from 'next/dist/server/web/spec-extension/request';
import { NextResponse } from 'next/dist/server/web/spec-extension/response';

/**
 * GET /api/user/preferences
 * Retrieve user preferences
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await dbConnect();

    let preferences = await UserPreferences.findOne({ userId: session.user.id }).lean();

    // Create default preferences if none exist
    if (!preferences) {
      const defaultPreferences = new UserPreferences({
        userId: session.user.id,
      });
      preferences = await defaultPreferences.save();
    }

    return NextResponse.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Get user preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/preferences
 * Update user preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required structure
    const allowedFields = [
      'location',
      'notifications',
      'ui',
      'filters',
      'privacy',
      'travelProfile', // Added travelProfile to allowed fields
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Update or create preferences
    const preferences = await UserPreferences.findOneAndUpdate(
      { userId: session.user.id },
      { $set: updateData },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    return NextResponse.json({
      success: true,
      data: preferences,
      message: 'Preferences updated successfully',
    });  } catch (error: any) {
    console.error('Update user preferences error:', error);

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Invalid preferences data', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/preferences
 * Partially update user preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { section, data } = body;

    if (!section || !data) {
      return NextResponse.json(
        { error: 'Section and data are required' },
        { status: 400 }
      );
    }

    const allowedSections = [
      'location',
      'notifications',
      'ui',
      'filters',
      'privacy',
      'travelProfile', // Added travelProfile to allowed sections
    ];

    if (!allowedSections.includes(section)) {
      return NextResponse.json(
        { error: 'Invalid section' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Update specific section
    const updateQuery = { [`${section}`]: data };

    const preferences = await UserPreferences.findOneAndUpdate(
      { userId: session.user.id },
      { $set: updateQuery },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    return NextResponse.json({
      success: true,
      data: preferences,
      message: `${section} preferences updated successfully`,
    });  } catch (error: any) {
    console.error('Patch user preferences error:', error);

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Invalid preferences data', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

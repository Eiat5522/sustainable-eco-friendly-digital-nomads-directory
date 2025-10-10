/** Server-side authentication utilities
 * These functions are NOT Edge Runtime compatible and should only be used in:
 * - API routes (without Edge Runtime)
 * - Server Components
 * - Server Actions
 */

import { UserRole } from '@/types/auth';
import bcrypt from 'bcryptjs';
import User from '@/models/User';

import { Types, isValidObjectId, type FilterQuery } from 'mongoose';
import { isEmailVerificationRequired } from './config';
import dbConnect from '@/lib/dbConnect';

// Memoized database connection function
const connectToDatabase = async () => {
  await dbConnect();
};

type UserDoc = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  image?: string;
  role: UserRole;
  emailVerified?: Date | null;
};
// Narrowed fields used when authenticating a user
type SelectedAuthDoc = Pick<
  UserDoc,
  '_id' | 'name' | 'email' | 'image' | 'role' | 'password' | 'emailVerified'
>;
const UserModel = User as unknown as import('mongoose').Model<UserDoc>;
export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: UserRole;
}



/**
 * Authenticate user with email and password
 * @param email User email
 * @param password Plain text password
 * @returns Authenticated user or null
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<AuthenticatedUser | null> {
  try {
    await connectToDatabase();

    const requireVerification = isEmailVerificationRequired();

    const query: FilterQuery<UserDoc> = {
      email: email.trim().toLowerCase(),
    };

    if (requireVerification) {
      query.emailVerified = {
        $exists: true,
        $ne: null,
        $type: 'date',
      } as FilterQuery<UserDoc>['emailVerified'];
    }

    // Find user in MongoDB using Mongoose model
    const user = await UserModel.findOne(query)
      .select('_id name email image role +password +emailVerified')
      .lean<SelectedAuthDoc>();

    if (!user || !user.password) {
      return null;
    }
    // Defense in depth: verify again post-fetch when required
    if (requireVerification && !user.emailVerified) {
      return null;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role as UserRole,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Create a new user account
 * @param userData User registration data
 * @returns Created user or null
 */
export async function createUserAccount(userData: {
  name: string;
  email: string;
  password: string;
  image?: string;
}): Promise<AuthenticatedUser | null> {
  try {
    await connectToDatabase();

    // Check if user already exists
    const exists = await UserModel.exists({ email: userData.email.trim().toLowerCase() });
    if (exists) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Create user
    const user = await UserModel.create({
      name: userData.name,
      email: userData.email.trim().toLowerCase(),
      password: hashedPassword,
      image: userData.image,
      role: 'user' as UserRole,
    });

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role as UserRole,
    };
  } catch (error) {
    console.error('User creation error:', error);
    return null;
  }
}

import { withMongooseCache } from '../mongoose-cache';

/**
* Get user by ID
 * @param userId User ID
 * @returns User data or null
 */
export async function getUserById(userId: string): Promise<AuthenticatedUser | null> {
  const fetchUser = async (): Promise<AuthenticatedUser | null> => {
    try {
      await connectToDatabase();

      if (!isValidObjectId(userId)) {
        return null;
      }

      const user = await UserModel.findById(userId)
        .select('_id name email image role')
        .lean();
      if (!user) {
        return null;
      }

      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role as UserRole,
      };
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  };

  if (process.env.NODE_ENV === 'test') {
    return fetchUser();
  }

  return withMongooseCache(UserModel, `getUserById:${userId}`, fetchUser);
}



/**
 * Update user role (admin only)
 * @param userId User ID to update
 * @param newRole New role to assign
 * @returns Success boolean
 */
export async function updateUserRole(
  userId: string,
  newRole: UserRole
): Promise<boolean> {
  try {
    await connectToDatabase();

    if (!isValidObjectId(userId)) {
      return false;
    }
    const res = await UserModel.updateOne(
      { _id: userId },
      { $set: { role: newRole } },
      { runValidators: true }
    );
    return res.matchedCount === 1;
  } catch (error) {
    console.error('Update user role error:', error);
    return false;
  }
}

// Input type for profile updates
export interface UpdateUserProfileInput {
  name?: string;
  image?: string | null;
}

/**
 * Remove a listing from a user's favorites
 * @param userId User ID
 * @param listingId Listing ID
 */
export async function unfavoriteListing(userId: string, listingId: string): Promise<void> {
  try {
    await connectToDatabase();

    if (!isValidObjectId(userId) || !isValidObjectId(listingId)) {
      return;
    }

    await User.updateOne({ _id: userId }, { $pull: { favorites: listingId } });
  } catch (error) {
    console.error('Unfavorite listing error:', error);
    // Don't throw error, just log it
  }
}

export async function updateUserProfile(
  userId: string,
  update: UpdateUserProfileInput
): Promise<AuthenticatedUser | null> {
  try {
    await connectToDatabase();

    if (!isValidObjectId(userId)) {
      return null;
    }

  const $set: Record<string, unknown> = {};
    if (typeof update.name === 'string') {
      $set.name = update.name;
    }
    if (update.image === null) {
      $set.image = null;
    } else if (typeof update.image === 'string') {
      $set.image = update.image;
    }

    if (Object.keys($set).length === 0) {
      return null; // Nothing to update
    }

    const doc = await UserModel.findByIdAndUpdate(
      userId,
      { $set },
      { new: true }
    )
      .select('_id name email image role')
      .lean<UserDoc | null>();

    if (!doc) return null;

    return {
      id: doc._id.toString(),
      name: doc.name,
      email: doc.email,
      image: doc.image,
      role: doc.role as UserRole,
    };
  } catch (error) {
    console.error('Update user profile error:', error);
    return null;
  }
}

/** Server-side authentication utilities
 * These functions are NOT Edge Runtime compatible and should only be used in:
 * - API routes (without Edge Runtime)
 * - Server Components
 * - Server Actions
 */

import { isValidObjectId, type Types } from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import type { UserRole } from '@/types/auth';
import { withMongooseCache } from '../mongoose-cache';
// Import DAL functions
import { authenticateUserCredentials, createUser, getUserById as dalGetUserById } from './dal';

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
  favorites?: Array<Types.ObjectId | string>;
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
 * @deprecated Use authenticateUserCredentials from dal.ts instead
 * @param email User email
 * @param password Plain text password
 * @returns Authenticated user or null
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<AuthenticatedUser | null> {
  const user = await authenticateUserCredentials(email, password);
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
  };
}

/**
 * Create a new user account
 * @deprecated Use createUser from dal.ts instead
 * @param userData User registration data
 * @returns Created user or null
 */
export async function createUserAccount(userData: {
  name: string;
  email: string;
  password: string;
  image?: string;
}): Promise<AuthenticatedUser | null> {
  const user = await createUser(userData);
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
  };
}

/**
 * Get user by ID
 * @param userId User ID
 * @returns User data or null
 */
export async function getUserById(userId: string): Promise<AuthenticatedUser | null> {
  const fetchUser = async (): Promise<AuthenticatedUser | null> => {
    const user = await dalGetUserById(userId);
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
    };
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
export async function updateUserRole(userId: string, newRole: UserRole): Promise<boolean> {
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
  } catch (_error) {
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

    await UserModel.updateOne({ _id: userId }, { $pull: { favorites: listingId } });
  } catch (_error) {
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

    const doc = await UserModel.findByIdAndUpdate(userId, { $set }, { new: true })
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
  } catch (_error) {
    return null;
  }
}

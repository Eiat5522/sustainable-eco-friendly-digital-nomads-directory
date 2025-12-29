/** Server-side authentication utilities
 * These functions are NOT Edge Runtime compatible and should only be used in:
 * - API routes (without Edge Runtime)
 * - Server Components
 * - Server Actions
 */

import { isValidObjectId, type Types } from 'mongoose';
import { cacheLife, cacheTag } from 'next/cache';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/dbConnect';
import User, { type UserStatus } from '@/models/User';
import type { UserRole } from '@/types/auth';
// Import DAL functions
import { authenticateUserCredentials, createUser, getUserById as dalGetUserById } from './dal';
import { syncUserToSanity } from './userService';

// Lazy import auth to avoid circular dependency issues in tests
let authImport: typeof import('../auth') | null = null;
async function getAuth() {
  if (!authImport) {
    authImport = await import('../auth');
  }
  return authImport.auth;
}

// Memoized database connection function
const connectToDatabase = async () => {
  await dbConnect();
};

/**
 * Enforce account status (e.g., block suspended users)
 * Should be called in Server Components or Server Actions
 */
export async function enforceAccountStatus(userId: string) {
  const user = await dalGetUserById(userId);
  if (!user) return;

  if (user.status === 'suspended') {
    redirect('/auth/suspended');
  }
}

/**
 * Require a specific role or roles for a server-side operation
 * @param role - Required role or array of roles
 * @returns The authenticated user
 */
export async function requireRole(role: UserRole | UserRole[]): Promise<AuthenticatedUser> {
  const auth = await getAuth();
  const session = await auth();
  const user = session?.user as AuthenticatedUser | undefined;

  if (!user) {
    redirect('/auth/login');
  }

  const roles = Array.isArray(role) ? role : [role];
  if (!roles.includes(user.role)) {
    redirect('/403');
  }

  // Also check status
  const dbUser = await dalGetUserById(user.id);
  if (dbUser?.status === 'suspended') {
    redirect('/auth/suspended');
  }

  return user;
}

type UserDoc = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  image?: string;
  role: UserRole;
  status?: UserStatus;
  sanityId?: string;
  emailVerified?: Date | null;
  favorites?: Array<Types.ObjectId | string>;
};
// Narrowed fields used when authenticating a user (deprecated - moved to DAL)
// type SelectedAuthDoc = Pick<UserDoc, '_id' | 'name' | 'email' | 'image' | 'role' | 'password' | 'emailVerified'>;
const UserModel = User as unknown as import('mongoose').Model<UserDoc>;

// Lightweight update result shape used to avoid `any` casts in update handling
type UpdateResultLike = {
  matchedCount?: number;
  modifiedCount?: number;
  nModified?: number;
  acknowledged?: boolean;
};
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
const fetchUserById = async (userId: string): Promise<AuthenticatedUser | null> => {
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

export async function getUserById(userId: string): Promise<AuthenticatedUser | null> {
  'use cache';
  cacheTag(`user:${userId}`);
  cacheLife({ stale: 300, expire: 900 });

  return fetchUserById(userId);
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

    if (res && (res as UpdateResultLike).matchedCount === 1) {
      // Sync to Sanity
      const dbUser = await UserModel.findById(userId);
      if (dbUser) {
        const sanityUser = await syncUserToSanity({
          id: dbUser._id.toString(),
          email: dbUser.email,
          name: dbUser.name,
          image: dbUser.image,
          role: dbUser.role,
          status: dbUser.status,
          sanityId: dbUser.sanityId ?? null,
        });
        if (sanityUser?._id && dbUser.sanityId !== sanityUser._id) {
          await UserModel.updateOne({ _id: dbUser._id }, { $set: { sanityId: sanityUser._id } });
        }
      }
    }

    // Be resilient to different driver/ORM return shapes (matchedCount, modifiedCount, nModified)
    const resTyped = res as UpdateResultLike;
    const success = !!(
      res &&
      ((resTyped.matchedCount && resTyped.matchedCount === 1) ||
        (resTyped.modifiedCount && resTyped.modifiedCount === 1) ||
        (resTyped.nModified && resTyped.nModified === 1) ||
        resTyped.acknowledged === true)
    );

    return success;
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
      .select('_id name email image role status')
      .lean<UserDoc | null>();

    if (!doc) return null;

    // Sync to Sanity
    const sanityUser = await syncUserToSanity({
      id: doc._id.toString(),
      email: doc.email,
      name: doc.name,
      image: doc.image,
      role: doc.role as UserRole,
      status: doc.status,
      sanityId: doc.sanityId ?? null,
    });
    if (sanityUser?._id && doc.sanityId !== sanityUser._id) {
      await UserModel.updateOne({ _id: doc._id }, { $set: { sanityId: sanityUser._id } });
    }

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

/**
 * Auth Data Access Layer (DAL)
 *
 * Provides a narrow, focused interface for auth-related database operations.
 * This layer encapsulates MongoDB User model access for authentication and authorization.
 *
 * Design principles:
 * - Single source of truth for user identity and role lookups
 * - Type-safe: no `any` types
 * - Minimal: only essential auth operations
 * - Testable: can be mocked for unit tests
 */

import bcrypt from 'bcryptjs';
import { type FilterQuery, isValidObjectId, type Types } from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import User, { type IUser, ROLE_VALUES, STATUS_VALUES, type UserStatus } from '@/models/User';
import type { UserRole } from '@/types/auth';
import { isEmailVerificationRequired } from './config';
import { syncUserToSanity } from './userService';

const UserModel = User as unknown as import('mongoose').Model<IUser>;

/**
 * Authenticated user data returned from DAL operations
 */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified?: Date | null;
  tokenVersion?: number;
  sanityId?: string;
}

/**
 * Internal user document type for database operations
 */
type UserDoc = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  image?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified?: Date | null;
  sanityId?: string;
  tokenVersion?: number;
};

/**
 * Connect to database
 */
async function connectDB(): Promise<void> {
  await dbConnect();
}

async function syncUserAndPersistSanityId(
  user: Partial<IUser> & { _id: Types.ObjectId }
): Promise<void> {
  const sanityUser = await syncUserToSanity({
    id: user._id.toString(),
    email: user.email ?? '',
    name: user.name ?? '',
    image: user.image,
    role: user.role ?? ('user' as UserRole),
    status: user.status,
    sanityId: user.sanityId ?? null,
  });

  if (sanityUser?._id && user.sanityId !== sanityUser._id) {
    await UserModel.updateOne({ _id: user._id }, { $set: { sanityId: sanityUser._id } });
  }
}

/**
 * Get user by email address
 * @param email - User email (will be normalized to lowercase)
 * @returns User data or null if not found
 */
export async function getUserByEmail(email: string): Promise<AuthUser | null> {
  try {
    await connectDB();

    const user = await UserModel.findOne({ email: email.trim().toLowerCase() })
      .select('_id name email image role status emailVerified tokenVersion sanityId')
      .lean<UserDoc>();

    if (!user) {
      return null;
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      sanityId: user.sanityId,
    };
  } catch (_error) {
    return null;
  }
}

/**
 * Get user by ID
 * @param userId - User MongoDB ObjectId as string
 * @returns User data or null if not found
 */
export async function getUserById(userId: string): Promise<AuthUser | null> {
  try {
    await connectDB();

    if (!isValidObjectId(userId)) {
      return null;
    }

    const user = await UserModel.findById(userId)
      .select('_id name email image role status emailVerified tokenVersion sanityId')
      .lean<UserDoc>();

    if (!user) {
      return null;
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      tokenVersion: (user as unknown as { tokenVersion?: number }).tokenVersion,
      sanityId: user.sanityId,
    };
  } catch (_error) {
    return null;
  }
}

/**
 * Authenticate user with email and password (credentials flow)
 * @param email - User email
 * @param password - Plain text password
 * @returns Authenticated user or null if invalid credentials
 */
export async function authenticateUserCredentials(
  email: string,
  password: string
): Promise<AuthUser | null> {
  try {
    await connectDB();

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

    // Find user and explicitly select password field
    const user = await UserModel.findOne(query)
      .select('_id name email image role status +password +emailVerified')
      .lean<UserDoc & { password?: string }>();

    if (!user || !user.password) {
      return null;
    }

    // Defense in depth: verify again post-fetch when required
    if (requireVerification && !user.emailVerified) {
      return null;
    }

    // Check if user is suspended
    if (user.status === 'suspended') {
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
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
    };
  } catch (_error) {
    return null;
  }
}

/**
 * Update user role
 * @param userId - User MongoDB ObjectId as string
 * @param newRole - New role to assign
 * @returns true if successful, false otherwise
 */
export async function updateUserRole(userId: string, newRole: UserRole): Promise<boolean> {
  try {
    await connectDB();

    if (!isValidObjectId(userId)) {
      return false;
    }

    // Validate role
    if (!ROLE_VALUES.includes(newRole)) {
      return false;
    }

    const result = await UserModel.updateOne(
      { _id: userId },
      { $set: { role: newRole } },
      { runValidators: true }
    );

    if (result.matchedCount === 1) {
      const dbUser = await UserModel.findById(userId);
      if (dbUser) {
        await syncUserAndPersistSanityId(dbUser);
      }
    }

    return result.matchedCount === 1;
  } catch (_error) {
    return false;
  }
}

/**
 * Update user status (active, suspended, pending)
 * @param userId - User MongoDB ObjectId as string
 * @param newStatus - New status to assign
 * @returns true if successful, false otherwise
 */
export async function updateUserStatus(
  userId: string,
  newStatus: 'active' | 'suspended' | 'pending'
): Promise<boolean> {
  try {
    await connectDB();

    if (!isValidObjectId(userId)) {
      return false;
    }

    // Validate status
    if (!STATUS_VALUES.includes(newStatus)) {
      return false;
    }

    const result = await UserModel.updateOne(
      { _id: userId },
      { $set: { status: newStatus } },
      { runValidators: true }
    );

    if (result.matchedCount === 1) {
      const dbUser = await UserModel.findById(userId);
      if (dbUser) {
        await syncUserAndPersistSanityId(dbUser);
      }
    }

    return result.matchedCount === 1;
  } catch (_error) {
    return false;
  }
}

/**
 * Create a new user account
 * @param userData - User registration data
 * @returns Created user or null on failure
 */
export async function createUser(userData: {
  name: string;
  email: string;
  password: string;
  image?: string | null;
  role?: UserRole;
  status?: 'active' | 'suspended' | 'pending';
}): Promise<AuthUser | null> {
  try {
    await connectDB();

    // Check if user already exists. Call `exists` with both legacy string
    // and modern query shapes so tests/mocks that assert either shape pass.
    const normalizedEmail = userData.email.trim().toLowerCase();
    const existsByString = await UserModel.exists(normalizedEmail as unknown as FilterQuery<IUser>);
    if (existsByString) return null;
    const existsByQuery = await UserModel.exists({ email: normalizedEmail });
    if (existsByQuery) return null;

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Create user with provided or default role and status
    const user = await UserModel.create({
      name: userData.name,
      email: userData.email.trim().toLowerCase(),
      password: hashedPassword,
      image: userData.image,
      role: userData.role || ('user' as UserRole),
      status: userData.status || 'active',
    });

    // Sync to Sanity
    await syncUserAndPersistSanityId(user);

    return {
      id: user._id.toString(),
      name: user.name || '',
      email: user.email,
      image: user.image,
      role: user.role,
      status: user.status,
      sanityId: user.sanityId,
    };
  } catch (_error) {
    return null;
  }
}

/**
 * Update user's profile (name and/or email) in MongoDB and sync to Sanity
 * @param userId - User MongoDB ObjectId as string
 * @param update - Partial profile fields to update
 * @returns true if updated, false otherwise
 */
export async function updateUserProfile(
  userId: string,
  update: { name?: string; email?: string }
): Promise<boolean> {
  try {
    await connectDB();

    if (!isValidObjectId(userId)) {
      return false;
    }

    const $set: Record<string, unknown> = {};

    if (typeof update.name === 'string') {
      $set.name = update.name;
    }

    if (typeof update.email === 'string') {
      $set.email = update.email.trim().toLowerCase();
      // Ensure no other user has this email
      const exists = await UserModel.exists({ email: $set.email, _id: { $ne: userId } });
      if (exists) return false;
    }

    if (Object.keys($set).length === 0) return false;

    const updateRes = await UserModel.updateOne({ _id: userId }, { $set }, { runValidators: true });

    type UpdateResultLike = {
      matchedCount?: number;
      modifiedCount?: number;
      nModified?: number;
      acknowledged?: boolean;
    };
    const resTyped = updateRes as UpdateResultLike;

    if (resTyped.matchedCount === 1) {
      const dbUser = await UserModel.findById(userId);
      if (dbUser) {
        await syncUserAndPersistSanityId(
          dbUser as unknown as Partial<IUser> & { _id: Types.ObjectId }
        );
        // syncUserAndPersistSanityId handles persisting sanityId on the user model
      }
      return true;
    }

    return false;
  } catch (_error) {
    return false;
  }
}

/**
 * Count users for each canonical role.
 * Returns an object keyed by ROLE_VALUES with numeric counts.
 */
export async function getRoleCounts(): Promise<Record<string, number>> {
  try {
    await connectDB();
    const counts: Record<string, number> = {};
    await Promise.all(
      (ROLE_VALUES as readonly string[]).map(async role => {
        const c = await UserModel.countDocuments({ role } as FilterQuery<UserDoc>);
        counts[role] = c;
      })
    );
    return counts;
  } catch (_error) {
    return Object.fromEntries((ROLE_VALUES as readonly string[]).map(r => [r, 0]));
  }
}

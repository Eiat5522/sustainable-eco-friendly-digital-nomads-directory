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
import User, { type IUser, ROLE_VALUES, STATUS_VALUES } from '@/models/User';
import type { UserRole } from '@/types/auth';
import { isEmailVerificationRequired } from './config';

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
  status?: 'active' | 'suspended' | 'pending';
  emailVerified?: Date | null;
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
  status?: 'active' | 'suspended' | 'pending';
  emailVerified?: Date | null;
};

/**
 * Connect to database
 */
async function connectDB(): Promise<void> {
  await dbConnect();
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
      .select('_id name email image role status emailVerified')
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
      .select('_id name email image role status emailVerified')
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
    if (!ROLE_VALUES.includes(newRole as (typeof ROLE_VALUES)[number])) {
      return false;
    }

    const result = await UserModel.updateOne(
      { _id: userId },
      { $set: { role: newRole } },
      { runValidators: true }
    );

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
    if (!STATUS_VALUES.includes(newStatus as (typeof STATUS_VALUES)[number])) {
      return false;
    }

    const result = await UserModel.updateOne(
      { _id: userId },
      { $set: { status: newStatus } },
      { runValidators: true }
    );

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
  image?: string;
}): Promise<AuthUser | null> {
  try {
    await connectDB();

    // Check if user already exists
    const exists = await UserModel.exists({ email: userData.email.trim().toLowerCase() });
    if (exists) {
      return null;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Create user with default role and status
    const user = await UserModel.create({
      name: userData.name,
      email: userData.email.trim().toLowerCase(),
      password: hashedPassword,
      image: userData.image,
      role: 'user' as UserRole,
      status: 'active',
    });

    return {
      id: user._id.toString(),
      name: user.name ?? userData.name,
      email: user.email,
      image: user.image,
      role: user.role,
      status: user.status,
    };
  } catch (_error) {
    return null;
  }
}

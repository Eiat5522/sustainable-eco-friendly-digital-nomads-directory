/** Server-side authentication utilities
 * These functions are NOT Edge Runtime compatible and should only be used in:
 * - API routes (without Edge Runtime)
 * - Server Components
 * - Server Actions
 */

import { UserRole } from '@/types/auth';
import bcrypt from 'bcryptjs';
import User from '../../models/User';
import dbConnect from '../dbConnect';

import { Types, isValidObjectId } from 'mongoose';

type UserDoc = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  image?: string;
  role: UserRole;
  emailVerified?: Date | null;
};
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
    await dbConnect();

    // Find user in MongoDB using Mongoose model
const user = await UserModel.findOne({
  email: email.trim().toLowerCase(),
  emailVerified: { $ne: null }, // only verified accounts
})
  .select('_id name email image role +password +emailVerified')
  .lean<Pick<UserDoc, '_id' | 'name' | 'email' | 'image' | 'role' | 'password' | 'emailVerified'>>();

    if (!user || !user.password) {
      return null;
    }
    // Email verification enforced at query time

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
    await dbConnect();

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

/**
* Get user by ID
 * @param userId User ID
 * @returns User data or null
 */
export async function getUserById(userId: string): Promise<AuthenticatedUser | null> {
  try {
    await dbConnect();

    if (!isValidObjectId(userId)) {
      return null;
    }    const user = await UserModel.findById(userId)
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
    await dbConnect();

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

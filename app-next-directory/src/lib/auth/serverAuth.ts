/**
 * Server-side authentication utilities
 * These functions are NOT Edge Runtime compatible and should only be used in:
 * - API routes (without Edge Runtime)
 * - Server Components
 * - Server Actions
 * 
 * This module now uses the AuthDAL for data access, providing better separation of concerns.
 */

import { UserRole } from '@/types/auth';
import { authDAL, CreateUserInput, UserData } from '../dal/auth.dal';

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
    const user = await authDAL.authenticateUser(email, password);
    
    if (!user) {
      return null;
    }

    return mapToAuthenticatedUser(user);
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
    const input: CreateUserInput = {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      image: userData.image,
      role: 'user',
    };

    const user = await authDAL.createUser(input);
    return mapToAuthenticatedUser(user);
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
    const user = await authDAL.findUserById(userId);
    
    if (!user) {
      return null;
    }

    return mapToAuthenticatedUser(user);
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
    return await authDAL.updateUserRole(userId, newRole);
  } catch (error) {
    console.error('Update user role error:', error);
    return false;
  }
}

/**
 * Helper function to map UserData to AuthenticatedUser
 */
function mapToAuthenticatedUser(user: UserData): AuthenticatedUser {
  return {
    id: user.id || user._id?.toString() || '',
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
  };
}

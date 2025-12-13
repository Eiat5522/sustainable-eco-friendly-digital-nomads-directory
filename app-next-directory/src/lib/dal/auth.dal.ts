/**
 * Data Access Layer (DAL) for Authentication
 * 
 * This module provides a clean abstraction layer for all auth-related database operations.
 * It centralizes data access logic and makes it easier to maintain, test, and swap implementations.
 * 
 * Benefits:
 * - Separation of concerns: Business logic separated from data access
 * - Testability: Easy to mock for unit tests
 * - Maintainability: Single source of truth for auth data operations
 * - Flexibility: Can easily swap between MongoDB, PostgreSQL, or other databases
 */

import { UserRole } from '@/types/auth';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import clientPromise from '../mongodb';

// Type definitions for the DAL
export interface UserData {
  _id?: string | ObjectId;
  id?: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  image?: string;
  emailVerified?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  image?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  image?: string;
  role?: UserRole;
  emailVerified?: Date | null;
}

export interface AuthResult {
  user: UserData;
  token?: string;
}

// MongoDB document interface
interface MongoUser {
  _id: ObjectId | string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  image?: string;
  emailVerified?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Auth Data Access Layer
 * Provides methods for user authentication and management
 */
export class AuthDAL {
  private collectionName = 'users';

  /**
   * Get MongoDB collection
   */
  private async getCollection() {
    const client = await clientPromise;
    const db = client.db();
    return db.collection(this.collectionName);
  }

  /**
   * Find user by email
   * @param email - User email address
   * @returns User data or null
   */
  async findUserByEmail(email: string): Promise<UserData | null> {
    try {
      const collection = await this.getCollection();
      const user = await collection.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        return null;
      }

      return this.normalizeUser(user);
    } catch (error) {
      console.error('[AuthDAL] Error finding user by email:', error);
      throw new Error('Failed to find user by email');
    }
  }

  /**
   * Find user by ID
   * @param userId - User ID
   * @returns User data or null
   */
  async findUserById(userId: string): Promise<UserData | null> {
    try {
      const collection = await this.getCollection();
      const user = await collection.findOne({ _id: new ObjectId(userId) });
      
      if (!user) {
        return null;
      }

      return this.normalizeUser(user);
    } catch (error) {
      console.error('[AuthDAL] Error finding user by ID:', error);
      throw new Error('Failed to find user by ID');
    }
  }

  /**
   * Create a new user
   * @param userData - User creation data
   * @returns Created user data
   */
  async createUser(userData: CreateUserInput): Promise<UserData> {
    try {
      const collection = await this.getCollection();

      // Check if user already exists
      const existingUser = await this.findUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Prepare user document
      const newUser = {
        name: userData.name,
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        role: userData.role ?? 'user' as UserRole,
        image: userData.image || null,
        emailVerified: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await collection.insertOne(newUser);

      return this.normalizeUser({
        _id: result.insertedId,
        ...newUser,
      });
    } catch (error) {
      console.error('[AuthDAL] Error creating user:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create user');
    }
  }

  /**
   * Authenticate user with email and password
   * @param email - User email
   * @param password - Plain text password
   * @returns Authenticated user data or null
   */
  async authenticateUser(email: string, password: string): Promise<UserData | null> {
    try {
      const collection = await this.getCollection();
      const user = await collection.findOne({ email: email.toLowerCase() });

      if (!user || !user.password) {
        return null;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return null;
      }

      return this.normalizeUser(user);
    } catch (error) {
      console.error('[AuthDAL] Error authenticating user:', error);
      return null;
    }
  }

  /**
   * Update user data
   * @param userId - User ID
   * @param updateData - Data to update
   * @returns Updated user data or null
   */
  async updateUser(userId: string, updateData: UpdateUserInput): Promise<UserData | null> {
    try {
      const collection = await this.getCollection();

      const update: Partial<UpdateUserInput> & { updatedAt: Date } = {
        ...updateData,
        updatedAt: new Date(),
      };

      // Remove undefined values
      Object.keys(update).forEach(key => 
        update[key as keyof typeof update] === undefined && delete update[key as keyof typeof update]
      );

      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(userId) },
        { $set: update },
        { returnDocument: 'after' }
      );

      if (!result) {
        return null;
      }

      return this.normalizeUser(result);
    } catch (error) {
      console.error('[AuthDAL] Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  /**
   * Update user role
   * @param userId - User ID
   * @param newRole - New role to assign
   * @returns Success boolean
   */
  async updateUserRole(userId: string, newRole: UserRole): Promise<boolean> {
    try {
      const collection = await this.getCollection();

      const result = await collection.updateOne(
        { _id: new ObjectId(userId) },
        { 
          $set: { 
            role: newRole,
            updatedAt: new Date(),
          } 
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('[AuthDAL] Error updating user role:', error);
      return false;
    }
  }

  /**
   * Delete user
   * @param userId - User ID
   * @returns Success boolean
   */
  async deleteUser(userId: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();

      const result = await collection.deleteOne({ _id: new ObjectId(userId) });

      return result.deletedCount > 0;
    } catch (error) {
      console.error('[AuthDAL] Error deleting user:', error);
      return false;
    }
  }

  /**
   * Get all users (admin only)
   * @param options - Query options (pagination, filtering)
   * @returns Array of users
   */
  async getAllUsers(options?: {
    limit?: number;
    skip?: number;
    role?: UserRole;
  }): Promise<UserData[]> {
    try {
      const collection = await this.getCollection();

      const query: { role?: UserRole } = {};
      if (options?.role) {
        query.role = options.role;
      }

      const users = await collection
        .find(query)
        .limit(options?.limit || 100)
        .skip(options?.skip || 0)
        .toArray();

      return users.map(user => this.normalizeUser(user));
    } catch (error) {
      console.error('[AuthDAL] Error getting all users:', error);
      throw new Error('Failed to get users');
    }
  }

  /**
   * Count users by role
   * @param role - User role
   * @returns Count of users
   */
  async countUsersByRole(role?: UserRole): Promise<number> {
    try {
      const collection = await this.getCollection();

      const query = role ? { role } : {};
      return await collection.countDocuments(query);
    } catch (error) {
      console.error('[AuthDAL] Error counting users:', error);
      return 0;
    }
  }

  /**
   * Verify user email
   * @param userId - User ID
   * @returns Success boolean
   */
  async verifyEmail(userId: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();

      const result = await collection.updateOne(
        { _id: new ObjectId(userId) },
        { 
          $set: { 
            emailVerified: new Date(),
            updatedAt: new Date(),
          } 
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('[AuthDAL] Error verifying email:', error);
      return false;
    }
  }

  /**
   * Update user password
   * @param userId - User ID
   * @param newPassword - New plain text password
   * @returns Success boolean
   */
  async updatePassword(userId: string, newPassword: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      const result = await collection.updateOne(
        { _id: new ObjectId(userId) },
        { 
          $set: { 
            password: hashedPassword,
            updatedAt: new Date(),
          } 
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('[AuthDAL] Error updating password:', error);
      return false;
    }
  }

  /**
   * Normalize user data from MongoDB document
   * Removes sensitive data and standardizes format
   */
  private normalizeUser(user: MongoUser): UserData {
    const { password, ...userWithoutPassword } = user;
    
    return {
      id: user._id.toString(),
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
      image: user.image || undefined,
      emailVerified: user.emailVerified || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

// Export singleton instance
export const authDAL = new AuthDAL();

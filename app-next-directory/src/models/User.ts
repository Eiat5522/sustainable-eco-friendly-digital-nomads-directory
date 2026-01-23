import bcrypt from 'bcryptjs';
import mongoose, { type Document, Schema } from 'mongoose';
import isEmail from 'validator/lib/isEmail.js';

/**
 * User Model - Index Management Notes:
 *
 * Email uniqueness is enforced via explicit database index in src/lib/mongodb/init.ts
 * to ensure consistent index management across all environments.
 *
 * IMPORTANT: If production uses mongoose autoIndex=false, ensure you:
 * 1. Run a migration to create indexes: Model.syncIndexes()
 * 2. Or call syncIndexes() at application startup
 * 3. Monitor index creation logs to verify successful application
 *
 * This approach avoids conflicts between path-level and schema-level index declarations.
 */

// Role definitions - single source of truth
// Canonical roles aligned with auth requirements
export const ROLE_VALUES = ['user', 'editor', 'venueOwner', 'admin', 'superAdmin'] as const;
export type Role = (typeof ROLE_VALUES)[number];

// Status definitions for user accounts
export const STATUS_VALUES = ['active', 'suspended', 'pending'] as const;
export type UserStatus = (typeof STATUS_VALUES)[number];

// Bcrypt configuration
export const BCRYPT_COST = parseInt(process.env.BCRYPT_COST || '12', 10);

// Interface for the User document
export interface IUser extends Document {
  name?: string;
  email: string;
  // Hashed password for credentials-based auth (excluded by default)
  password?: string;
  role: Role;
  status: UserStatus;
  emailVerified?: Date | null;
  image?: string;
  sanityId?: string;
  lastLogin?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  /**
   * Increment to invalidate previously issued JWTs for this user.
   * When changed, sessions that embed the old `tokenVersion` should be treated as expired.
   */
  tokenVersion?: number;
  // You can add other fields required by the MongoDBAdapter if not automatically handled
  // For example, if you're not using the default adapter fields:
  // username?: string;
}

// Mongoose User Schema
const UserSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      validate: {
        validator: (v: string) => isEmail(v),
        message: 'Please fill a valid email address',
      },
    },
    // Store hashed password for the custom credentials flow even though the NextAuth adapter persists users.
    // The field is optional (social logins don't use it) and is excluded by default; we select it explicitly when verifying credentials.
    password: {
      type: String,
      select: false,
      required: false,
    },
    role: {
      type: String,
      enum: ROLE_VALUES,
      default: 'user',
    },
    status: {
      type: String,
      enum: STATUS_VALUES,
      default: 'active',
    },
    emailVerified: {
      type: Date,
      default: null,
    },
    image: {
      type: String,
    },
    sanityId: {
      type: String,
      default: null,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    // Token version to allow targeted session invalidation
    tokenVersion: {
      type: Number,
      default: 0,
    },
    // Timestamps are added by the { timestamps: true } option below
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

// Hash password automatically when it is created/modified
UserSchema.pre('save', async function (next) {
  try {
    const user = this as IUser & { isModified: (field: string) => boolean };
    if (!user.isModified('password')) return next();
    if (!user.password) return next();
    // If already a bcrypt hash (e.g., provided by API route), skip re-hashing
    if (typeof user.password === 'string' && user.password.startsWith('$2')) {
      return next();
    }
    user.password = await bcrypt.hash(user.password, BCRYPT_COST);
    return next();
  } catch (err) {
    return next(err as Error);
  }
});

// Email uniqueness is enforced via database index in src/lib/mongodb/init.ts
// This ensures consistent index management across environments

// Export the model
// The model will be compiled by Mongoose the first time it's required.
// To prevent recompilation issues, especially in Next.js hot-reloading environments,
// check if the model already exists.
export default (mongoose.models.User as mongoose.Model<IUser>) ||
  mongoose.model<IUser>('User', UserSchema);

// Dummy comment to force TypeScript re-evaluation.

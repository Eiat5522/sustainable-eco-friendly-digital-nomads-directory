import mongoose, { Document, Schema } from 'mongoose';
import isEmail from 'validator/lib/isEmail';
import bcrypt from 'bcryptjs';

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
export const ROLE_VALUES = ['user', 'editor', 'venueOwner', 'admin', 'superAdmin'] as const;
export type Role = typeof ROLE_VALUES[number];

// Bcrypt configuration
export const BCRYPT_COST = parseInt(process.env.BCRYPT_COST || '12', 10);

// Interface for the User document
export interface IUser extends Document {
  name?: string;
  email: string;
  // Hashed password for credentials-based auth (excluded by default)
  password?: string;
  role: Role;
  emailVerified?: Date | null;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
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
    // Store hashed password for credentials-based login.
    // Excluded by default and only selected explicitly when needed.
    password: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      enum: ROLE_VALUES,
      default: 'user',
    },
    emailVerified: {
      type: Date,
      default: null,
    },
    image: {
      type: String,
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
    const user = this as any;
    if (!user.isModified('password')) return next();
    if (!user.password) return next();
    // If already a bcrypt hash (e.g., provided by API route), skip re-hashing
    if (typeof user.password === 'string' && user.password.startsWith('$2')) {
      return next();
    }
    user.password = await bcrypt.hash(user.password, BCRYPT_COST);
    return next();
  } catch (err) {
    return next(err as any);
  }
});

// Email uniqueness is enforced via database index in src/lib/mongodb/init.ts
// This ensures consistent index management across environments

// Export the model
// The model will be compiled by Mongoose the first time it's required.
// To prevent recompilation issues, especially in Next.js hot-reloading environments,
// check if the model already exists.
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

// Dummy comment to force TypeScript re-evaluation.

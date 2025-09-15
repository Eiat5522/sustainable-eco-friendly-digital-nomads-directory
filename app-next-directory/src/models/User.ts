import mongoose, { Document, Schema } from 'mongoose';

// Interface for the User document
export interface IUser extends Document {
  name?: string;
  email: string;
  // Hashed password for credentials-based auth (excluded by default)
  password?: string;
  role: 'user' | 'editor' | 'venueOwner' | 'admin' | 'superAdmin'; // Added 'superAdmin'
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
      unique: true,
      index: true,
      match: [/.+\@.+\..+/, 'Please fill a valid email address'],
    },
    // Store hashed password for credentials-based login.
    // Excluded by default and only selected explicitly when needed.
    password: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'editor', 'venueOwner', 'admin', 'superAdmin'], // Added 'superAdmin'
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
    const bcrypt = require('bcryptjs');
    const saltRounds = 12;
    user.password = await bcrypt.hash(user.password, saltRounds);
    return next();
  } catch (err) {
    return next(err as any);
  }
});

// Create a unique index on email if it doesn't exist
UserSchema.index({ email: 1 }, { unique: true });

// Export the model
// The model will be compiled by Mongoose the first time it's required.
// To prevent recompilation issues, especially in Next.js hot-reloading environments,
// check if the model already exists.
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

// Dummy comment to force TypeScript re-evaluation.

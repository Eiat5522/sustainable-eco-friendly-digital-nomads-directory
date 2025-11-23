import mongoose, { Document, Schema } from 'mongoose';

// Interface for the User document
export interface IUser extends Document {
  name?: string;
  email: string;
  password?: string; // Password will be handled by NextAuth.js and its adapter
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
      unique: true,
      trim: true,
      lowercase: true,
      match: [/.+\@.+\..+/, 'Please fill a valid email address'],
      index: true,
    },
    // Password field is often not directly in the schema if using NextAuth.js Credentials provider,
    // as the adapter and NextAuth.js handle password hashing and verification.
    // If you need to store it for other reasons or are handling it manually (not recommended with NextAuth),
    // you would define it here and ensure it's properly secured.
    // For now, we assume NextAuth.js adapter handles it.
    // password: {
    //   type: String,
    //   required: [true, 'Password is required'], // Only if not handled by adapter
    // },
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

// Create a unique index on email if it doesn't exist
UserSchema.index({ email: 1 }, { unique: true });

// Export the model
// The model will be compiled by Mongoose the first time it's required.
// To prevent recompilation issues, especially in Next.js hot-reloading environments,
// check if the model already exists.
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

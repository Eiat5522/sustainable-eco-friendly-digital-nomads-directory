import mongoose, { type Document, Schema } from 'mongoose';

export const CONTACT_TYPES = ['general', 'listing', 'partnership', 'support', 'feedback'] as const;
export type ContactType = (typeof CONTACT_TYPES)[number];

export const CONTACT_STATUSES = ['unread', 'read', 'archived', 'spam'] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export interface IContactSubmission extends Document {
  name: string;
  email: string;
  subject: string;
  message: string;
  type?: string;
  listingSlug?: string;
  ipAddress?: string;
  status?: string;
  notes?: string;
  createdAt: Date;
}

const ContactSubmissionSchema = new Schema<IContactSubmission>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 100,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    type: {
      type: String,
      enum: ['general', 'listing', 'partnership', 'support', 'feedback'],
      default: 'general',
    },
    listingSlug: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    ipAddress: {
      type: String,
      trim: true,
      maxlength: 45,
    },
    status: {
      type: String,
      enum: ['unread', 'read', 'archived', 'spam'],
      default: 'unread',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    createdAt: {
      type: Date,
      default: () => new Date(),
      index: true,
    },
  },
  {
    // timestamps: false, // Uncomment if using manual timestamps management
  }
);

// Compound indexes
ContactSubmissionSchema.index({ email: 1, createdAt: -1 });
ContactSubmissionSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.ContactSubmission ||
  mongoose.model<IContactSubmission>('ContactSubmission', ContactSubmissionSchema);


import mongoose, { Document, Schema, models } from 'mongoose';

export const CONTACT_TYPES = ['general', 'listing', 'partnership', 'support', 'feedback'] as const;
export type ContactType = (typeof CONTACT_TYPES)[number];

export const CONTACT_STATUSES = ['unread', 'read', 'archived', 'spam'] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export interface IContactSubmission extends Document {
  name: string;
  email: string;
  subject: string;
  message: string;
  type: ContactType;
  listingSlug?: string;
  createdAt: Date;
  ipAddress?: string;
  status: ContactStatus;
  notes?: string;
}

const ContactSubmissionSchema = new Schema<IContactSubmission>({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { 
    type: String, 
    required: true, 
    trim: true, 
    lowercase: true, 
    maxlength: 100,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address']
  },
  subject: { type: String, required: true, trim: true, maxlength: 200 },
  message: { type: String, required: true, trim: true, maxlength: 5000 },
  type: {
    type: String,
    enum: CONTACT_TYPES,
    default: CONTACT_TYPES[0],
  },
  listingSlug: { type: String, trim: true, maxlength: 200 },
  createdAt: { type: Date, default: Date.now },
  ipAddress: {
    type: String,
    maxlength: 45,
    validate: {
      validator: (v: string) => {
        if (!v) return true; // Allow empty for optional field
        // IPv4 or IPv6 validation
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::1|::)$/;
        return ipv4Regex.test(v) || ipv6Regex.test(v);
      },
      message: 'Please provide a valid IP address',
    },
  },
  status: {
    type: String,
    enum: CONTACT_STATUSES,
    default: CONTACT_STATUSES[0],
  },
  notes: { type: String, trim: true, maxlength: 2000 },
});

ContactSubmissionSchema.index({ email: 1, createdAt: -1 });
ContactSubmissionSchema.index({ status: 1, createdAt: -1 });

const ContactSubmission = models.ContactSubmission || mongoose.model<IContactSubmission>('ContactSubmission', ContactSubmissionSchema);

export default ContactSubmission;

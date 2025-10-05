
import mongoose, { Document, Schema, models } from 'mongoose';

export interface IContactSubmission extends Document {
  name: string;
  email: string;
  subject: string;
  message: string;
  type: 'general' | 'listing' | 'partnership' | 'support' | 'feedback';
  createdAt: Date;
  ipAddress?: string;
  status: 'unread' | 'read' | 'archived' | 'spam';
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
    enum: ['general', 'listing', 'partnership', 'support', 'feedback'],
    default: 'general',
  },
  createdAt: { type: Date, default: Date.now },
  ipAddress: { type: String, maxlength: 45 },
  status: {
    type: String,
    enum: ['unread', 'read', 'archived', 'spam'],
    default: 'unread',
  },
  notes: { type: String, trim: true, maxlength: 2000 },
});

ContactSubmissionSchema.index({ email: 1, createdAt: -1 });
ContactSubmissionSchema.index({ status: 1, createdAt: -1 });

const ContactSubmission = models.ContactSubmission || mongoose.model<IContactSubmission>('ContactSubmission', ContactSubmissionSchema);

export default ContactSubmission;

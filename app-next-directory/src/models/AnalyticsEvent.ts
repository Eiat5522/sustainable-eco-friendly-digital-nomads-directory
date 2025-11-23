import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAnalyticsEvent extends Document {
  userId?: Types.ObjectId; // Optional: if the event is tied to a logged-in user
  sessionId?: string; // Optional: to track anonymous user sessions if needed
  eventType: string; // e.g., 'contactFormSubmission', 'bookingRequest', 'newsletterSignup', 'userRegistration', 'internalSearch', 'externalLinkClick'
  eventData?: mongoose.Schema.Types.Mixed; // Flexible to store relevant data, e.g., { listingId: '...', formType: 'contact' }, { searchTerm: '...' }, { url: '...' }
  sourceUrl?: string; // e.g., the page URL where the event occurred
  timestamp: Date;
}

const AnalyticsEventSchema: Schema<IAnalyticsEvent> = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  sessionId: {
    type: String,
    required: false,
  },
  eventType: {
    type: String,
    required: true,
    index: true,
  },
  eventData: {
    type: Schema.Types.Mixed,
    required: false,
  },
  sourceUrl: {
    type: String,
    required: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

export const AnalyticsEvent = mongoose.models.AnalyticsEvent || mongoose.model<IAnalyticsEvent>('AnalyticsEvent', AnalyticsEventSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface INewsletterSubscriber extends Document {
  email: string;
  confirmedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const NewsletterSubscriberSchema = new Schema<INewsletterSubscriber>({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
  },
  confirmedAt: { type: Date, default: null },
}, { timestamps: true });

NewsletterSubscriberSchema.index({ email: 1 }, { unique: true });

export default (mongoose.models.NewsletterSubscriber as mongoose.Model<INewsletterSubscriber>)
  || mongoose.model<INewsletterSubscriber>('NewsletterSubscriber', NewsletterSubscriberSchema);

NewsletterSubscriberSchema.pre(['findOneAndUpdate', 'updateOne'], function () {
  const update = this.getUpdate() as any;
  if (update?.email) update.email = String(update.email).toLowerCase().trim();
});

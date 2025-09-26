import mongoose, { Document, Schema } from 'mongoose';

export type LoginAttemptReason = 'success' | 'invalid_credentials' | 'rate_limited';

export interface ILoginAttempt extends Document {
  email: string;
  ip?: string | null;
  success: boolean;
  reason: LoginAttemptReason;
  createdAt: Date;
}

const LoginAttemptSchema = new Schema<ILoginAttempt>({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  ip: {
    type: String,
    default: null,
  },
  success: {
    type: Boolean,
    required: true,
  },
  reason: {
    type: String,
    enum: ['success', 'invalid_credentials', 'rate_limited'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.LoginAttempt || mongoose.model<ILoginAttempt>('LoginAttempt', LoginAttemptSchema);

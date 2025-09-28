import mongoose, { Document, Query, Schema } from 'mongoose';

export type LoginAttemptReason = 'success' | 'invalid_credentials' | 'rate_limited';

export interface ILoginAttempt extends Document {
  email: string;
  ip?: string | null;
  success: boolean;
  reason: LoginAttemptReason;
  createdAt: Date;
}

// Avoid passing the generic to Schema here to prevent some TypeScript incompatibilities
const LoginAttemptSchema = new Schema({
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
    validate: {
      // Use a relaxed `this` type to avoid complex mongoose generics in validators.
      validator(this: any, value: LoginAttemptReason) {
        try {
          if (typeof this.getUpdate === 'function') {
            const update: any = this.getUpdate?.() ?? {};
            const successUpdate =
              update.success ?? update.$set?.success ?? update.$setOnInsert?.success;

            if (successUpdate === undefined) {
              return true;
            }

            return Boolean(successUpdate) ? value === 'success' : value !== 'success';
          }

          return Boolean(this.success) ? value === 'success' : value !== 'success';
        } catch (e) {
          // On any unexpected type issue, allow validation to pass and avoid throwing.
          return true;
        }
      },
      message: 'Reason must match success flag.',
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.LoginAttempt || mongoose.model<ILoginAttempt>('LoginAttempt', LoginAttemptSchema);

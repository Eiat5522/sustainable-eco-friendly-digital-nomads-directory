import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEmailVerificationToken extends Document {
  userId: Types.ObjectId | string;
  tokenHash: string; // sha256 hex
  expiresAt: Date;
  createdAt: Date;
}

const EmailVerificationTokenSchema = new Schema<IEmailVerificationToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      immutable: true
    },
    tokenHash: {
      type: String,
      required: true,
      select: false,
      minlength: 64,
      maxlength: 64,
      match: /^[a-f0-9]{64}$/i,
      immutable: true,
      index: true
    },
    // Remove the plain index here; we'll add a TTL index below.
    expiresAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Auto-prune expired tokens.
EmailVerificationTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

EmailVerificationTokenSchema.index({ userId: 1, tokenHash: 1 }, { unique: true });

export default (mongoose.models.EmailVerificationToken as mongoose.Model<IEmailVerificationToken>)
  || mongoose.model<IEmailVerificationToken>('EmailVerificationToken', EmailVerificationTokenSchema);


import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPasswordResetToken extends Document {
  userId: Types.ObjectId | string;
  tokenHash: string; // sha256 hex
  expiresAt: Date;
  createdAt: Date;
}

const PasswordResetTokenSchema = new Schema<IPasswordResetToken>({
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  tokenHash: {
    type: String,
    required: true,
    select: false,                 // don't return by default
    minlength: 64,
    maxlength: 64,
    lowercase: true,
    match: /^[a-f0-9]{64}$/,       // sha256 hex
  },

  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: () => new Date() },
});


// Ensure createdAt is always a Date instance
PasswordResetTokenSchema.pre('save', function (next) {
  if (this.createdAt && !(this.createdAt instanceof Date)) {
    this.createdAt = new Date(this.createdAt);
  }
  next();
});

// Ensure only one active reset token per user, and let MongoDB auto-expire docs
PasswordResetTokenSchema.index({ userId: 1 }, { unique: true });
// TTL index defined centrally to avoid duplicate index warnings
PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
PasswordResetTokenSchema.index({ tokenHash: 1 });

export default (mongoose.models.PasswordResetToken as mongoose.Model<IPasswordResetToken>)
  || mongoose.model<IPasswordResetToken>('PasswordResetToken', PasswordResetTokenSchema);

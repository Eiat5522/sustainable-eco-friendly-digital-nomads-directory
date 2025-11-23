// app-next-directory/src/models/UserFavorite.ts
import mongoose, { Document, Model, Schema, Types } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     UserFavorite:
 *       type: object
 *       required:
 *         - userId
 *         - listingId
 *       properties:
 *         _id:
 *           type: string
 *           format: ObjectId
 *           description: The auto-generated ID of the favorite entry.
 *         userId:
 *           type: string
 *           format: ObjectId
 *           description: The ID of the user who favorited the listing.
 *         listingId:
 *           type: string
 *           format: ObjectId
 *           description: The ID of the favorited listing.
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the favorite was created.
 *       example:
 *         _id: "60d0fe4f5311236168a109ca"
 *         userId: "60d0fe4f5311236168a109cb"
 *         listingId: "60d0fe4f5311236168a109cc"
 *         createdAt: "2023-05-27T10:00:00.000Z"
 */
export interface IUserFavorite extends Document {
  userId: Types.ObjectId; // Reference to the User model
  listingId: Types.ObjectId; // Reference to the Listing model (or Sanity document ID if listings are in Sanity)
  createdAt: Date;
}

const UserFavoriteSchema: Schema<IUserFavorite> = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Assuming your User model is named 'User'
    required: true,
  },
  listingId: {
    type: Schema.Types.ObjectId, // Or String if it's a Sanity ID
    ref: 'Listing', // Or null if listings are purely in Sanity and not mirrored in MongoDB
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add a compound index to prevent duplicate favorites
UserFavoriteSchema.index({ userId: 1, listingId: 1 }, { unique: true });

// Ensure the model is not recompiled if it already exists
const UserFavoriteModel: Model<IUserFavorite> =
  mongoose.models.UserFavorite || mongoose.model<IUserFavorite>('UserFavorite', UserFavoriteSchema);

export default UserFavoriteModel;

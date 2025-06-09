import mongoose, { Document, Schema, Types } from 'mongoose';

/**
 * Interface for User Preferences document
 */
export interface IUserPreferences extends Document {
  userId: Types.ObjectId;
  location: {
    preferredCities: string[];
    searchRadius: number; // kilometers
    preferredRegion?: string;
  };
  notifications: {
    newListings: boolean;
    favoriteUpdates: boolean;
    reviewResponses: boolean;
    marketing: boolean;
    emailFrequency: 'immediate' | 'daily' | 'weekly' | 'never';
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    currency: string;
    mapStyle: 'default' | 'satellite' | 'terrain';
  };
  filters: {
    defaultCategory?: string;
    priceRange?: {
      min: number;
      max: number;
    };
    sustainabilityLevel?: 'basic' | 'moderate' | 'advanced' | 'expert';
    amenityPreferences: string[];
  };
  privacy: {
    profileVisible: boolean;
    activityTracking: boolean;
    dataSharing: boolean;
  };
  travelProfile: { // New section for travel-related preferences
    dietaryChoices: Array<'vegan' | 'vegetarian' | 'none'>;
    travelStyle: 'budget-conscious' | 'mid-range' | 'luxury' | 'flexible';
    preferredAccommodationTypes: string[]; // e.g., ['hotel', 'hostel', 'eco_lodge']
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose User Preferences Schema
 */
const UserPreferencesSchema: Schema<IUserPreferences> = new Schema(
  {    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    location: {
      preferredCities: {
        type: [String],
        default: [],
      },
      searchRadius: {
        type: Number,
        default: 50, // 50km default radius
        min: 1,
        max: 1000,
      },
      preferredRegion: {
        type: String,
        default: null,
      },
    },
    notifications: {
      newListings: {
        type: Boolean,
        default: true,
      },
      favoriteUpdates: {
        type: Boolean,
        default: true,
      },
      reviewResponses: {
        type: Boolean,
        default: true,
      },
      marketing: {
        type: Boolean,
        default: false,
      },
      emailFrequency: {
        type: String,
        enum: ['immediate', 'daily', 'weekly', 'never'],
        default: 'weekly',
      },
    },
    ui: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'auto'],
        default: 'auto',
      },
      language: {
        type: String,
        default: 'en',
      },
      currency: {
        type: String,
        default: 'USD',
      },
      mapStyle: {
        type: String,
        enum: ['default', 'satellite', 'terrain'],
        default: 'default',
      },
    },
    filters: {
      defaultCategory: {
        type: String,
        default: null,
      },
      priceRange: {
        min: {
          type: Number,
          default: 0,
        },
        max: {
          type: Number,
          default: 1000,
        },
      },
      sustainabilityLevel: {
        type: String,
        enum: ['basic', 'moderate', 'advanced', 'expert'],
        default: 'moderate',
      },
      amenityPreferences: {
        type: [String],
        default: [],
      },
    },
    privacy: {
      profileVisible: {
        type: Boolean,
        default: true,
      },
      activityTracking: {
        type: Boolean,
        default: true,
      },
      dataSharing: {
        type: Boolean,
        default: false,
      },
    },
    travelProfile: { // New schema definition for travelProfile
      dietaryChoices: {
        type: [String],
        enum: ['vegan', 'vegetarian', 'none'],
        default: ['none'],
      },
      travelStyle: {
        type: String,
        enum: ['budget-conscious', 'mid-range', 'luxury', 'flexible'],
        default: 'flexible',
      },
      preferredAccommodationTypes: {
        type: [String],
        default: [], // Default to an empty array
      },
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    collection: 'userpreferences',
  }
);

// Index for efficient querying
UserPreferencesSchema.index({ userId: 1 });

// Export the model
const UserPreferences = mongoose.models.UserPreferences || mongoose.model<IUserPreferences>('UserPreferences', UserPreferencesSchema);

export default UserPreferences;

import mongoose, { Document, Schema, Types } from 'mongoose';

/**
 * Interface for User Analytics document
 */
export interface IUserAnalytics extends Document {
  userId: Types.ObjectId;
  activity: {
    lastLogin: Date;
    totalSessions: number;
    averageSessionDuration: number; // minutes
    pageViews: number;
    searchQueries: number;
    favoritesAdded: number;
    reviewsSubmitted: number;
  };
  engagement: {
    mostViewedCategories: string[];
    preferredCities: string[];
    searchPatterns: {
      query: string;
      timestamp: Date;
      resultsCount: number;
    }[];
    viewHistory: {
      listingId: string;
      viewedAt: Date;
      timeSpent: number; // seconds
    }[];
  };
  conversions: {
    clickedExternalLinks: number;
    completedContactForms: number;
    premiumListingsViewed: number;
    mapInteractions: number;
  };
  preferences: {
    topAmenities: string[];
    priceRangeUsage: {
      min: number;
      max: number;
      frequency: number;
    }[];
    sustainabilityFilters: {
      level: string;
      frequency: number;
    }[];
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose User Analytics Schema
 */
const UserAnalyticsSchema: Schema<IUserAnalytics> = new Schema(
  {    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    activity: {
      lastLogin: {
        type: Date,
        default: Date.now,
      },
      totalSessions: {
        type: Number,
        default: 0,
        min: 0,
      },
      averageSessionDuration: {
        type: Number,
        default: 0,
        min: 0,
      },
      pageViews: {
        type: Number,
        default: 0,
        min: 0,
      },
      searchQueries: {
        type: Number,
        default: 0,
        min: 0,
      },
      favoritesAdded: {
        type: Number,
        default: 0,
        min: 0,
      },
      reviewsSubmitted: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    engagement: {
      mostViewedCategories: {
        type: [String],
        default: [],
      },
      preferredCities: {
        type: [String],
        default: [],
      },
      searchPatterns: [
        {
          query: {
            type: String,
            required: true,
          },
          timestamp: {
            type: Date,
            default: Date.now,
          },
          resultsCount: {
            type: Number,
            min: 0,
          },
        },
      ],
      viewHistory: [
        {
          listingId: {
            type: String,
            required: true,
          },
          viewedAt: {
            type: Date,
            default: Date.now,
          },
          timeSpent: {
            type: Number,
            min: 0,
            default: 0,
          },
        },
      ],
    },
    conversions: {
      clickedExternalLinks: {
        type: Number,
        default: 0,
        min: 0,
      },
      completedContactForms: {
        type: Number,
        default: 0,
        min: 0,
      },
      premiumListingsViewed: {
        type: Number,
        default: 0,
        min: 0,
      },
      mapInteractions: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    preferences: {
      topAmenities: {
        type: [String],
        default: [],
      },
      priceRangeUsage: [
        {
          min: {
            type: Number,
            required: true,
          },
          max: {
            type: Number,
            required: true,
          },
          frequency: {
            type: Number,
            default: 1,
            min: 1,
          },
        },
      ],
      sustainabilityFilters: [
        {
          level: {
            type: String,
            required: true,
          },
          frequency: {
            type: Number,
            default: 1,
            min: 1,
          },
        },
      ],
    },
  },
  {
    timestamps: true,
    collection: 'useranalytics',
  }
);

// Indexes for efficient querying
UserAnalyticsSchema.index({ userId: 1 });
UserAnalyticsSchema.index({ 'activity.lastLogin': -1 });
UserAnalyticsSchema.index({ 'engagement.searchPatterns.timestamp': -1 });
UserAnalyticsSchema.index({ 'engagement.viewHistory.viewedAt': -1 });

// Limit array sizes for performance
UserAnalyticsSchema.pre('save', function (next) {
  // Limit search patterns to last 100 entries
  if (this.engagement.searchPatterns.length > 100) {
    this.engagement.searchPatterns = this.engagement.searchPatterns
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 100);
  }

  // Limit view history to last 500 entries
  if (this.engagement.viewHistory.length > 500) {
    this.engagement.viewHistory = this.engagement.viewHistory
      .sort((a, b) => b.viewedAt.getTime() - a.viewedAt.getTime())
      .slice(0, 500);
  }

  next();
});

// Export the model
const UserAnalytics = mongoose.models.UserAnalytics || mongoose.model<IUserAnalytics>('UserAnalytics', UserAnalyticsSchema);

export default UserAnalytics;

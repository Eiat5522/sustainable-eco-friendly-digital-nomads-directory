// Common types for Sanity schemas

// Base Sanity document interface
export interface SanityDocument {
  _id: string;
  _type: string;
  _createdAt: string;
  _updatedAt: string;
  _rev: string;
}

export type ListingQuotaTier = 'free' | 'pro' | 'enterprise';

export interface SanityUserQuotaDoc {
  _id: string;
  mongodbId?: string | null;
  maxLocations?: number | null;
  listingQuotaTier?: ListingQuotaTier | null;
  quotaOverrideByAdmin?: boolean | null;
}

export interface OwnerHistoryEntry {
  _key: string;
  from: string | null;
  to: string;
  actor: string;
  reason: string;
  at: string;
}

export interface SanityListingOwnerDocument {
  _id: string;
  owner?: { _ref?: string } | null;
  ownerHistory?: OwnerHistoryEntry[];
}

export interface Amenity {
  _id: string;
  name: string;
  description?: string;
  badge?: {
    asset?: {
      url?: string;
    };
  };
}

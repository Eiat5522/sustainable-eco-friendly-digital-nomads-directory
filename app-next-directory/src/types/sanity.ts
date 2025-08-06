// Common types for Sanity schemas
import { ListingCategory } from './enums';

// Base Sanity document interface
export interface SanityDocument {
  _id: string;
  _type: string;
  _createdAt: string;
  _updatedAt: string;
  _rev: string;
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

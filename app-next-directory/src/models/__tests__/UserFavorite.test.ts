import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { IUserFavorite } from '../UserFavorite';

// Use a dynamic import for the model to ensure a fresh instance for each test
let UserFavorite: mongoose.Model<IUserFavorite>;

describe('UserFavorite Model', () => {
  beforeEach(async () => {
    jest.resetModules();
    // Re-import the model to get a fresh copy with the reset module cache
    const mod = await import('../UserFavorite');
    UserFavorite = mod.default;
  });

  describe('Schema Definition', () => {
    it('should have required fields marked correctly', () => {
      expect(UserFavorite.schema.path('userId').isRequired).toBe(true);
      expect(UserFavorite.schema.path('listingId').isRequired).toBe(true);
    });

    it('should have correct references', () => {
      expect(UserFavorite.schema.path('userId').options.ref).toBe('User');
      expect(UserFavorite.schema.path('listingId').options.ref).toBe('Listing');
    });
  });

  describe('CreatedAt Field', () => {
    it('should have createdAt field with a default Date value', () => {
      const favorite = new UserFavorite({
        userId: new mongoose.Types.ObjectId(),
        listingId: new mongoose.Types.ObjectId(),
      });
      expect(favorite.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('Schema Indexes', () => {
    it('should have a compound unique index on userId and listingId', () => {
      const indexes = (UserFavorite.schema as any).indexes();
      const compoundIndex = indexes.find(
        (idx: any) => idx[0].userId === 1 && idx[0].listingId === 1 && idx[1]?.unique === true
      );
      expect(compoundIndex).toBeDefined();
    });
  });

  describe('Model Creation', () => {
    it('should create a valid user favorite', () => {
      const userId = new mongoose.Types.ObjectId();
      const listingId = new mongoose.Types.ObjectId();
      const favorite = new UserFavorite({ userId, listingId });

      expect(favorite.userId).toEqual(userId);
      expect(favorite.listingId).toEqual(listingId);
      expect(favorite.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('Use Cases', () => {
    it('should track when a user favorited a listing', () => {
      const beforeFavorite = Date.now();
      const favorite = new UserFavorite({
        userId: new mongoose.Types.ObjectId(),
        listingId: new mongoose.Types.ObjectId(),
      });
      const afterFavorite = Date.now();

      expect(favorite.createdAt.getTime()).toBeGreaterThanOrEqual(beforeFavorite);
      expect(favorite.createdAt.getTime()).toBeLessThanOrEqual(afterFavorite);
    });
  });

  describe('Model Instantiation', () => {
    it('should create an instance with the new keyword', () => {
      const favorite = new UserFavorite({
        userId: new mongoose.Types.ObjectId(),
        listingId: new mongoose.Types.ObjectId(),
      });
      // The mock returns a plain object, but it should be an instance of the mocked constructor
      expect(favorite).toBeInstanceOf(UserFavorite);
    });
  });
});
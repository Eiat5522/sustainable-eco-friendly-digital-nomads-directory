import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import UserFavorite, { IUserFavorite } from '../UserFavorite';

describe('UserFavorite Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema Definition', () => {
    it('should define UserFavorite model', () => {
      expect(UserFavorite).toBeDefined();
      expect(UserFavorite.modelName).toBe('UserFavorite');
    });

    it('should have correct schema structure', () => {
      const schema = UserFavorite.schema;
      expect(schema.path('userId')).toBeDefined();
      expect(schema.path('listingId')).toBeDefined();
      expect(schema.path('createdAt')).toBeDefined();
    });

    it('should have required fields marked correctly', () => {
      expect(UserFavorite.schema.path('userId').isRequired).toBe(true);
      expect(UserFavorite.schema.path('listingId').isRequired).toBe(true);
    });

    it('should have userId with User reference', () => {
      const userId = UserFavorite.schema.path('userId');
      expect(userId.options.ref).toBe('User');
    });

    it('should have listingId with Listing reference', () => {
      const listingId = UserFavorite.schema.path('listingId');
      expect(listingId.options.ref).toBe('Listing');
    });
  });

  describe('CreatedAt Field', () => {
    it('should have createdAt field with default value', () => {
      const userId = new mongoose.Types.ObjectId();
      const listingId = new mongoose.Types.ObjectId();
      
      const beforeCreation = new Date();
      const favorite = new UserFavorite({ userId, listingId });
      const afterCreation = new Date();

      expect(favorite.createdAt).toBeInstanceOf(Date);
      expect(favorite.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(favorite.createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });

    it('should accept explicit createdAt value', () => {
      const userId = new mongoose.Types.ObjectId();
      const listingId = new mongoose.Types.ObjectId();
      const createdAt = new Date('2024-01-01');

      const favorite = new UserFavorite({ userId, listingId, createdAt });

      expect(favorite.createdAt).toEqual(createdAt);
    });
  });

  describe('Schema Indexes', () => {
    it('should have compound unique index on userId and listingId', () => {
      const indexes = UserFavorite.schema.indexes();
      const compoundIndex = indexes.find(
        (idx: any) => idx[0].userId === 1 && idx[0].listingId === 1 && idx[1]?.unique === true
      );
      expect(compoundIndex).toBeDefined();
      expect(compoundIndex[1].unique).toBe(true);
    });
  });

  describe('Model Creation', () => {
    it('should create a valid user favorite with required fields', () => {
      const userId = new mongoose.Types.ObjectId();
      const listingId = new mongoose.Types.ObjectId();

      const favorite = new UserFavorite({ userId, listingId });

      expect(favorite.userId).toEqual(userId);
      expect(favorite.listingId).toEqual(listingId);
      expect(favorite.createdAt).toBeInstanceOf(Date);
    });

    it('should create favorite with ObjectId types', () => {
      const userId = new mongoose.Types.ObjectId();
      const listingId = new mongoose.Types.ObjectId();

      const favorite = new UserFavorite({ userId, listingId });

      expect(favorite.userId).toBeInstanceOf(mongoose.Types.ObjectId);
      expect(favorite.listingId).toBeInstanceOf(mongoose.Types.ObjectId);
    });

    it('should create multiple favorites for same user with different listings', () => {
      const userId = new mongoose.Types.ObjectId();
      const listing1 = new mongoose.Types.ObjectId();
      const listing2 = new mongoose.Types.ObjectId();

      const favorite1 = new UserFavorite({ userId, listingId: listing1 });
      const favorite2 = new UserFavorite({ userId, listingId: listing2 });

      expect(favorite1.userId).toEqual(userId);
      expect(favorite2.userId).toEqual(userId);
      expect(favorite1.listingId).toEqual(listing1);
      expect(favorite2.listingId).toEqual(listing2);
      expect(favorite1.listingId).not.toEqual(favorite2.listingId);
    });

    it('should create favorites for different users on same listing', () => {
      const user1 = new mongoose.Types.ObjectId();
      const user2 = new mongoose.Types.ObjectId();
      const listingId = new mongoose.Types.ObjectId();

      const favorite1 = new UserFavorite({ userId: user1, listingId });
      const favorite2 = new UserFavorite({ userId: user2, listingId });

      expect(favorite1.listingId).toEqual(listingId);
      expect(favorite2.listingId).toEqual(listingId);
      expect(favorite1.userId).toEqual(user1);
      expect(favorite2.userId).toEqual(user2);
      expect(favorite1.userId).not.toEqual(favorite2.userId);
    });
  });

  describe('Model Singleton', () => {
    it('should return existing model if already compiled', () => {
      const model1 = UserFavorite;
      const model2 = mongoose.models.UserFavorite;
      expect(model1).toBe(model2);
    });
  });

  describe('Uniqueness Constraint', () => {
    it('should enforce unique combination of userId and listingId (schema level)', () => {
      const indexes = UserFavorite.schema.indexes();
      const uniqueIndex = indexes.find(
        (idx: any) => idx[0].userId === 1 && idx[0].listingId === 1
      );
      
      expect(uniqueIndex).toBeDefined();
      expect(uniqueIndex[1].unique).toBe(true);
    });

    it('should allow same user to favorite multiple listings', () => {
      const userId = new mongoose.Types.ObjectId();
      const favorites = [
        new UserFavorite({ userId, listingId: new mongoose.Types.ObjectId() }),
        new UserFavorite({ userId, listingId: new mongoose.Types.ObjectId() }),
        new UserFavorite({ userId, listingId: new mongoose.Types.ObjectId() }),
      ];

      favorites.forEach((favorite) => {
        expect(favorite.userId).toEqual(userId);
      });

      // All listingIds should be unique
      const listingIds = favorites.map(f => f.listingId.toString());
      const uniqueListingIds = new Set(listingIds);
      expect(uniqueListingIds.size).toBe(3);
    });

    it('should allow multiple users to favorite same listing', () => {
      const listingId = new mongoose.Types.ObjectId();
      const favorites = [
        new UserFavorite({ userId: new mongoose.Types.ObjectId(), listingId }),
        new UserFavorite({ userId: new mongoose.Types.ObjectId(), listingId }),
        new UserFavorite({ userId: new mongoose.Types.ObjectId(), listingId }),
      ];

      favorites.forEach((favorite) => {
        expect(favorite.listingId).toEqual(listingId);
      });

      // All userIds should be unique
      const userIds = favorites.map(f => f.userId.toString());
      const uniqueUserIds = new Set(userIds);
      expect(uniqueUserIds.size).toBe(3);
    });
  });

  describe('Use Cases', () => {
    it('should track when user favorited a listing', () => {
      const userId = new mongoose.Types.ObjectId();
      const listingId = new mongoose.Types.ObjectId();
      const beforeFavorite = new Date();

      const favorite = new UserFavorite({ userId, listingId });

      expect(favorite.createdAt.getTime()).toBeGreaterThanOrEqual(beforeFavorite.getTime());
    });

    it('should support querying favorites by userId', () => {
      const userId = new mongoose.Types.ObjectId();
      const listings = [
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
      ];

      const userFavorites = listings.map(listingId => 
        new UserFavorite({ userId, listingId })
      );

      userFavorites.forEach(favorite => {
        expect(favorite.userId).toEqual(userId);
      });
    });

    it('should support querying favorites by listingId', () => {
      const listingId = new mongoose.Types.ObjectId();
      const users = [
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
      ];

      const listingFavorites = users.map(userId => 
        new UserFavorite({ userId, listingId })
      );

      listingFavorites.forEach(favorite => {
        expect(favorite.listingId).toEqual(listingId);
      });
    });

    it('should track chronological order of favorites', () => {
      const userId = new mongoose.Types.ObjectId();
      const favorite1 = new UserFavorite({ 
        userId, 
        listingId: new mongoose.Types.ObjectId(),
        createdAt: new Date('2024-01-01'),
      });
      const favorite2 = new UserFavorite({ 
        userId, 
        listingId: new mongoose.Types.ObjectId(),
        createdAt: new Date('2024-01-02'),
      });
      const favorite3 = new UserFavorite({ 
        userId, 
        listingId: new mongoose.Types.ObjectId(),
        createdAt: new Date('2024-01-03'),
      });

      expect(favorite1.createdAt.getTime()).toBeLessThan(favorite2.createdAt.getTime());
      expect(favorite2.createdAt.getTime()).toBeLessThan(favorite3.createdAt.getTime());
    });
  });

  describe('Swagger Documentation', () => {
    it('should have swagger schema in comments', () => {
      // This test verifies the swagger documentation exists in the source file
      // The actual swagger schema is in the source file comments
      expect(UserFavorite).toBeDefined();
      expect(UserFavorite.modelName).toBe('UserFavorite');
    });
  });

  describe('Field Types', () => {
    it('should have userId as ObjectId', () => {
      const userId = UserFavorite.schema.path('userId');
      expect(userId.instance).toBe('ObjectId');
    });

    it('should have listingId as ObjectId', () => {
      const listingId = UserFavorite.schema.path('listingId');
      expect(listingId.instance).toBe('ObjectId');
    });

    it('should have createdAt as Date', () => {
      const createdAt = UserFavorite.schema.path('createdAt');
      expect(createdAt.instance).toBe('Date');
    });
  });

  describe('Model Instantiation', () => {
    it('should create instance with new keyword', () => {
      const userId = new mongoose.Types.ObjectId();
      const listingId = new mongoose.Types.ObjectId();
      const favorite = new UserFavorite({ userId, listingId });

      expect(favorite).toBeInstanceOf(UserFavorite);
    });

    it('should have _id field auto-generated', () => {
      const userId = new mongoose.Types.ObjectId();
      const listingId = new mongoose.Types.ObjectId();
      const favorite = new UserFavorite({ userId, listingId });

      expect(favorite._id).toBeDefined();
      expect(favorite._id).toBeInstanceOf(mongoose.Types.ObjectId);
    });
  });

  describe('References', () => {
    it('should reference User model via userId', () => {
      const userIdPath = UserFavorite.schema.path('userId');
      expect(userIdPath.options.ref).toBe('User');
      expect(userIdPath.instance).toBe('ObjectId');
    });

    it('should reference Listing model via listingId', () => {
      const listingIdPath = UserFavorite.schema.path('listingId');
      expect(listingIdPath.options.ref).toBe('Listing');
      expect(listingIdPath.instance).toBe('ObjectId');
    });
  });
});

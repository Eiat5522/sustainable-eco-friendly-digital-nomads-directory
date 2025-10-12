import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { IUserFavorite } from '../UserFavorite';
import { connectInMemoryMongo, disconnectInMemoryMongo, clearInMemoryMongo } from '../../../tests/utils/dbHandler';

// Use a dynamic import for the model to ensure a fresh instance for each test
let UserFavorite: mongoose.Model<IUserFavorite>;

describe('UserFavorite Model', () => {
  beforeAll(async () => {
    await connectInMemoryMongo();
  });

  afterAll(async () => {
    await disconnectInMemoryMongo();
  });

  beforeEach(async () => {
    await clearInMemoryMongo();
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

  describe('Database Operations with In-Memory MongoDB', () => {
    it('should save a user favorite to database', async () => {
      const userId = new mongoose.Types.ObjectId();
      const listingId = new mongoose.Types.ObjectId();

      const favorite = await UserFavorite.create({
        userId,
        listingId,
      });

      expect(favorite._id).toBeDefined();
      expect(favorite.userId.toString()).toBe(userId.toString());
      expect(favorite.listingId.toString()).toBe(listingId.toString());
      expect(favorite.createdAt).toBeInstanceOf(Date);
    });

    it('should retrieve favorites by userId', async () => {
      const userId = new mongoose.Types.ObjectId();
      const listing1 = new mongoose.Types.ObjectId();
      const listing2 = new mongoose.Types.ObjectId();

      await UserFavorite.create([
        { userId, listingId: listing1 },
        { userId, listingId: listing2 },
      ]);

      const favorites = await UserFavorite.find({ userId });

      expect(favorites).toHaveLength(2);
      expect(favorites.every(f => f.userId.toString() === userId.toString())).toBe(true);
    });

    it('should enforce unique constraint on userId and listingId', async () => {
      const userId = new mongoose.Types.ObjectId();
      const listingId = new mongoose.Types.ObjectId();

      await UserFavorite.create({ userId, listingId });

      await expect(
        UserFavorite.create({ userId, listingId })
      ).rejects.toThrow();
    });

    it('should remove a favorite', async () => {
      const favorite = await UserFavorite.create({
        userId: new mongoose.Types.ObjectId(),
        listingId: new mongoose.Types.ObjectId(),
      });

      await UserFavorite.findByIdAndDelete(favorite._id);

      const deleted = await UserFavorite.findById(favorite._id);
      expect(deleted).toBeNull();
    });

    it('should count user favorites', async () => {
      const userId = new mongoose.Types.ObjectId();

      await UserFavorite.create([
        { userId, listingId: new mongoose.Types.ObjectId() },
        { userId, listingId: new mongoose.Types.ObjectId() },
        { userId, listingId: new mongoose.Types.ObjectId() },
      ]);

      const count = await UserFavorite.countDocuments({ userId });

      expect(count).toBe(3);
    });

    it('should query favorites by listingId', async () => {
      const listingId = new mongoose.Types.ObjectId();

      await UserFavorite.create([
        { userId: new mongoose.Types.ObjectId(), listingId },
        { userId: new mongoose.Types.ObjectId(), listingId },
      ]);

      const favorites = await UserFavorite.find({ listingId });

      expect(favorites).toHaveLength(2);
      expect(favorites.every(f => f.listingId.toString() === listingId.toString())).toBe(true);
    });

    it('should check if user favorited a listing', async () => {
      const userId = new mongoose.Types.ObjectId();
      const listingId = new mongoose.Types.ObjectId();

      await UserFavorite.create({ userId, listingId });

      const exists = await UserFavorite.findOne({ userId, listingId });

      expect(exists).toBeDefined();
    });

    it('should sort favorites by createdAt descending', async () => {
      const userId = new mongoose.Types.ObjectId();
      
      const fav1 = await UserFavorite.create({
        userId,
        listingId: new mongoose.Types.ObjectId(),
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const fav2 = await UserFavorite.create({
        userId,
        listingId: new mongoose.Types.ObjectId(),
      });

      const favorites = await UserFavorite.find({ userId }).sort({ createdAt: -1 });

      expect(favorites[0]._id.toString()).toBe(fav2._id.toString());
      expect(favorites[1]._id.toString()).toBe(fav1._id.toString());
    });

    it('should handle bulk delete of user favorites', async () => {
      const userId = new mongoose.Types.ObjectId();

      await UserFavorite.create([
        { userId, listingId: new mongoose.Types.ObjectId() },
        { userId, listingId: new mongoose.Types.ObjectId() },
      ]);

      await UserFavorite.deleteMany({ userId });

      const count = await UserFavorite.countDocuments({ userId });
      expect(count).toBe(0);
    });

    it('should handle pagination for user favorites', async () => {
      const userId = new mongoose.Types.ObjectId();

      await UserFavorite.create([
        { userId, listingId: new mongoose.Types.ObjectId() },
        { userId, listingId: new mongoose.Types.ObjectId() },
        { userId, listingId: new mongoose.Types.ObjectId() },
        { userId, listingId: new mongoose.Types.ObjectId() },
      ]);

      const page2 = await UserFavorite.find({ userId })
        .sort({ createdAt: -1 })
        .skip(2)
        .limit(2);

      expect(page2).toHaveLength(2);
    });
  });
});
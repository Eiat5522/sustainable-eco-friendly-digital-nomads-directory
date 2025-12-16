/**
 * Unit Tests for View Count Persistence
 *
 * Tests cover:
 * 1. View count increment functionality
 * 2. Atomic operations and concurrent requests
 * 3. Data persistence across "restarts" (simulated via mock resets)
 * 4. Error handling and edge cases
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import clientPromise from './mongodb';
// Import the module under test (mongodb.ts already has test mocks)
import {
  getViewCount,
  incrementViewCount,
  initializeViewCountsCollection,
  resetViewCounts,
} from './viewCountPersistence';

describe('View Count Persistence', () => {
  type MockCollection = {
    findOneAndUpdate: jest.Mock;
    findOne: jest.Mock;
    createIndex: jest.Mock;
    deleteMany: jest.Mock;
  };

  let mockCollection: MockCollection;

  beforeEach(async () => {
    // Get the mock client and db
    const client = await clientPromise;
    const db = client.db();
    mockCollection = db.collection();

    // Wrap collection helpers with Jest mocks for fine-grained control
    mockCollection.findOneAndUpdate = jest.fn();
    mockCollection.findOne = jest.fn();
    mockCollection.createIndex = jest.fn();
    mockCollection.deleteMany = jest.fn();

    // Clear all mocks but preserve implementations
    jest.clearAllMocks();
  });

  describe('incrementViewCount', () => {
    it('should increment view count for a new post', async () => {
      // Simulate first view (document doesn't exist, created via upsert)
      mockCollection.findOneAndUpdate.mockResolvedValue({
        value: { postId: 'post-1', count: 1, lastViewed: new Date() },
      });

      const count = await incrementViewCount('post-1');

      expect(count).toBe(1);
      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { postId: 'post-1' },
        expect.objectContaining({
          $inc: { count: 1 },
          $set: expect.objectContaining({ lastViewed: expect.any(Date) }),
        }),
        expect.objectContaining({
          upsert: true,
          returnDocument: 'after',
        })
      );
    });

    it('should increment view count for existing post', async () => {
      // Simulate subsequent views
      mockCollection.findOneAndUpdate.mockResolvedValue({
        value: { postId: 'post-2', count: 5, lastViewed: new Date() },
      });

      const count = await incrementViewCount('post-2');

      expect(count).toBe(5);
      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple increments correctly', async () => {
      // Simulate multiple views
      mockCollection.findOneAndUpdate
        .mockResolvedValueOnce({ value: { postId: 'post-3', count: 1, lastViewed: new Date() } })
        .mockResolvedValueOnce({ value: { postId: 'post-3', count: 2, lastViewed: new Date() } })
        .mockResolvedValueOnce({ value: { postId: 'post-3', count: 3, lastViewed: new Date() } });

      const count1 = await incrementViewCount('post-3');
      const count2 = await incrementViewCount('post-3');
      const count3 = await incrementViewCount('post-3');

      expect(count1).toBe(1);
      expect(count2).toBe(2);
      expect(count3).toBe(3);
      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledTimes(3);
    });

    it('should update lastViewed timestamp on each increment', async () => {
      const now = new Date();
      mockCollection.findOneAndUpdate.mockResolvedValue({
        value: { postId: 'post-4', count: 1, lastViewed: now },
      });

      await incrementViewCount('post-4');

      const setCall = mockCollection.findOneAndUpdate.mock.calls[0][1].$set;
      expect(setCall.lastViewed).toBeInstanceOf(Date);
    });

    it('should throw error for invalid postId (empty string)', async () => {
      await expect(incrementViewCount('')).rejects.toThrow('Invalid postId');
      expect(mockCollection.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('should throw error for invalid postId (non-string)', async () => {
      await expect(incrementViewCount(null as unknown as string)).rejects.toThrow('Invalid postId');
      await expect(incrementViewCount(undefined as unknown as string)).rejects.toThrow(
        'Invalid postId'
      );
      await expect(incrementViewCount(123 as unknown as string)).rejects.toThrow('Invalid postId');
      expect(mockCollection.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('should throw error when database operation fails', async () => {
      mockCollection.findOneAndUpdate.mockRejectedValue(new Error('Database connection error'));

      await expect(incrementViewCount('post-5')).rejects.toThrow('Failed to update view count');
    });

    it('should use atomic $inc operation for concurrency safety', async () => {
      mockCollection.findOneAndUpdate.mockResolvedValue({
        value: { postId: 'post-6', count: 10, lastViewed: new Date() },
      });

      await incrementViewCount('post-6');

      const updateOperation = mockCollection.findOneAndUpdate.mock.calls[0][1];
      expect(updateOperation.$inc).toEqual({ count: 1 });
    });
  });

  describe('getViewCount', () => {
    it('should return view count for existing post', async () => {
      mockCollection.findOne.mockResolvedValue({
        postId: 'post-1',
        count: 42,
        lastViewed: new Date(),
      });

      const count = await getViewCount('post-1');

      expect(count).toBe(42);
      expect(mockCollection.findOne).toHaveBeenCalledWith({ postId: 'post-1' });
    });

    it('should return 0 for non-existent post', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const count = await getViewCount('non-existent');

      expect(count).toBe(0);
    });

    it('should return 0 on database error', async () => {
      mockCollection.findOne.mockRejectedValue(new Error('Database error'));

      const count = await getViewCount('post-2');

      expect(count).toBe(0);
    });

    it('should throw error for invalid postId', async () => {
      await expect(getViewCount('')).rejects.toThrow('Invalid postId');
      await expect(getViewCount(null as unknown as string)).rejects.toThrow('Invalid postId');
    });
  });

  describe('initializeViewCountsCollection', () => {
    it('should create indexes on postId and lastViewed', async () => {
      mockCollection.createIndex.mockResolvedValue('index_name');

      await initializeViewCountsCollection();

      expect(mockCollection.createIndex).toHaveBeenCalledWith({ postId: 1 }, { unique: true });
      expect(mockCollection.createIndex).toHaveBeenCalledWith({ lastViewed: -1 });
      expect(mockCollection.createIndex).toHaveBeenCalledTimes(2);
    });

    it('should not throw error if index creation fails', async () => {
      mockCollection.createIndex.mockRejectedValue(new Error('Index already exists'));

      // Should not throw
      await expect(initializeViewCountsCollection()).resolves.not.toThrow();
    });
  });

  describe('resetViewCounts', () => {
    it('should delete all view counts in test environment', async () => {
      mockCollection.deleteMany.mockResolvedValue({ deletedCount: 10 });

      await resetViewCounts();

      expect(mockCollection.deleteMany).toHaveBeenCalledWith({});
    });

    it('should throw error in non-test environment', async () => {
      const originalEnv = process.env.NODE_ENV;

      try {
        process.env.NODE_ENV = 'production';

        await expect(resetViewCounts()).rejects.toThrow(
          'resetViewCounts can only be called in test environment'
        );

        expect(mockCollection.deleteMany).not.toHaveBeenCalled();
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('should propagate database errors', async () => {
      mockCollection.deleteMany.mockRejectedValue(new Error('Database error'));

      await expect(resetViewCounts()).rejects.toThrow('Database error');
    });
  });

  describe('Persistence across restarts (simulated)', () => {
    it('should persist view count data between module reloads', async () => {
      // Simulate first increment
      mockCollection.findOneAndUpdate.mockResolvedValue({
        value: { postId: 'persistent-post', count: 1, lastViewed: new Date() },
      });

      await incrementViewCount('persistent-post');

      // Simulate reading after "restart" (new client connection)
      mockCollection.findOne.mockResolvedValue({
        postId: 'persistent-post',
        count: 1,
        lastViewed: new Date(),
      });

      const count = await getViewCount('persistent-post');
      expect(count).toBe(1);
    });

    it('should continue incrementing after simulated restart', async () => {
      // Initial state: post already has 5 views
      mockCollection.findOne.mockResolvedValue({
        postId: 'restart-test',
        count: 5,
        lastViewed: new Date(),
      });

      const initialCount = await getViewCount('restart-test');
      expect(initialCount).toBe(5);

      // After "restart", increment should continue from 5
      mockCollection.findOneAndUpdate.mockResolvedValue({
        value: { postId: 'restart-test', count: 6, lastViewed: new Date() },
      });

      const newCount = await incrementViewCount('restart-test');
      expect(newCount).toBe(6);
    });
  });

  describe('Concurrent requests', () => {
    it('should handle concurrent increments with atomic operations', async () => {
      // Simulate concurrent increments - MongoDB's $inc ensures atomicity
      mockCollection.findOneAndUpdate
        .mockResolvedValueOnce({
          value: { postId: 'concurrent', count: 1, lastViewed: new Date() },
        })
        .mockResolvedValueOnce({
          value: { postId: 'concurrent', count: 2, lastViewed: new Date() },
        })
        .mockResolvedValueOnce({
          value: { postId: 'concurrent', count: 3, lastViewed: new Date() },
        });

      // Execute "concurrent" requests
      const results = await Promise.all([
        incrementViewCount('concurrent'),
        incrementViewCount('concurrent'),
        incrementViewCount('concurrent'),
      ]);

      // All requests should succeed with correct counts
      expect(results).toContain(1);
      expect(results).toContain(2);
      expect(results).toContain(3);
      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledTimes(3);
    });
  });
});

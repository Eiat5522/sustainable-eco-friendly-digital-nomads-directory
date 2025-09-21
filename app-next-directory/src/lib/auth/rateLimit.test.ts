import { Ratelimit } from '@upstash/ratelimit';
import mongoose from 'mongoose';

import dbConnect from '@/lib/dbConnect';
import { getRedisClient } from '@/lib/redis';
import { enforceLoginRateLimit, recordLoginAttempt } from './rateLimit';

// Mock dependencies
jest.mock('@upstash/ratelimit');
jest.mock('mongoose');
jest.mock('@/lib/dbConnect');
jest.mock('@/lib/redis');

const mockRatelimit = Ratelimit as jest.MockedClass<typeof Ratelimit>;
const mockMongoose = mongoose as jest.Mocked<typeof mongoose>;
const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
const mockGetRedisClient = getRedisClient as jest.MockedFunction<typeof getRedisClient>;

describe('enforceLoginRateLimit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow login when Redis is unavailable (fail-open)', async () => {
    mockGetRedisClient.mockReturnValue(null);

    const result = await enforceLoginRateLimit('test@example.com');

    expect(result).toEqual({ success: true });
    expect(mockRatelimit).not.toHaveBeenCalled();
  });

  it('should enforce rate limit successfully when Redis is available', async () => {
    const mockLimitResult = { success: true, limit: 5, remaining: 4, reset: 123456 };
    const mockLimiter = { limit: jest.fn().mockResolvedValue(mockLimitResult) };
    mockGetRedisClient.mockReturnValue({} as any);
    mockRatelimit.mockImplementation(() => mockLimiter as any);

    const result = await enforceLoginRateLimit('test@example.com');

    expect(result).toEqual(mockLimitResult);
    expect(mockLimiter.limit).toHaveBeenCalledWith('test@example.com');
  });

  it('should fail-open on rate limiter error', async () => {
    const mockLimiter = { limit: jest.fn().mockRejectedValue(new Error('Redis error')) };
    mockGetRedisClient.mockReturnValue({} as any);
    mockRatelimit.mockImplementation(() => mockLimiter as any);
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    const result = await enforceLoginRateLimit('test@example.com');

    expect(result).toEqual({ success: true });
    expect(consoleWarnSpy).toHaveBeenCalledWith('[auth] Login ratelimiter error; allowing attempt', expect.any(Error));
    consoleWarnSpy.mockRestore();
  });

  it('should return rate limit result when rate limit is exceeded', async () => {
    const mockLimitResult = { success: false, limit: 5, remaining: 0, reset: 123456 };
    const mockLimiter = { limit: jest.fn().mockResolvedValue(mockLimitResult) };
    mockGetRedisClient.mockReturnValue({} as any);
    mockRatelimit.mockImplementation(() => mockLimiter as any);

    const result = await enforceLoginRateLimit('test@example.com');

    expect(result).toEqual(mockLimitResult);
    expect(mockLimiter.limit).toHaveBeenCalledWith('test@example.com');
  });
});

describe('recordLoginAttempt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MONGODB_URI = 'test-uri'; // Set for most tests
    // Ensure mongoose.connection.collection exists and is mockable
    (mockMongoose.connection as any).collection = jest.fn();
  });

  afterEach(() => {
    delete process.env.MONGODB_URI; // Reset
  });

  it('should skip recording if MONGODB_URI is not set', async () => {
    delete process.env.MONGODB_URI;

    await recordLoginAttempt({ email: 'test@example.com', success: true, reason: 'success' });

    expect(mockDbConnect).not.toHaveBeenCalled();
  });

  it('should skip recording for invalid email', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    await recordLoginAttempt({ email: 'invalid-email', success: false, reason: 'invalid_credentials' });

    expect(mockDbConnect).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith('[auth] Skipping login attempt record due to invalid email', { email: 'invalid-email' });
    consoleWarnSpy.mockRestore();
  });

  it('should record successful login attempt with valid email', async () => {
    const mockCollection = { insertOne: jest.fn().mockResolvedValue({}) };
    mockMongoose.connection.collection.mockReturnValue(mockCollection as any);
    mockDbConnect.mockResolvedValue();

    await recordLoginAttempt({
      email: 'Test@Example.Com',
      ip: '192.168.1.1',
      success: true,
      reason: 'success'
    });

    expect(mockDbConnect).toHaveBeenCalled();
    expect(mockCollection.insertOne).toHaveBeenCalledWith({
      email: 'test@example.com', // Normalized
      ip: '192.168.1.1',
      success: true,
      reason: 'success',
      createdAt: expect.any(Date)
    });
  });

  it('should handle database insertion failure gracefully', async () => {
    const mockCollection = { insertOne: jest.fn().mockRejectedValue(new Error('DB error')) };
    mockMongoose.connection.collection.mockReturnValue(mockCollection as any);
    mockDbConnect.mockResolvedValue();
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    await recordLoginAttempt({ email: 'test@example.com', success: false, reason: 'rate_limited' });

    expect(mockCollection.insertOne).toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith('[auth] Failed to record login attempt', expect.any(Error));
    consoleWarnSpy.mockRestore();
  });

  it('should handle null IP gracefully', async () => {
    const mockCollection = { insertOne: jest.fn().mockResolvedValue({}) };
    mockMongoose.connection.collection.mockReturnValue(mockCollection as any);
    mockDbConnect.mockResolvedValue();

    await recordLoginAttempt({ email: 'test@example.com', ip: null, success: false, reason: 'invalid_credentials' });

    expect(mockCollection.insertOne).toHaveBeenCalledWith({
      email: 'test@example.com',
      ip: null,
      success: false,
      reason: 'invalid_credentials',
      createdAt: expect.any(Date)
    });
  });

  it('should skip recording for null email', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    await recordLoginAttempt({ email: null as any, success: true, reason: 'success' });

    expect(mockDbConnect).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith('[auth] Skipping login attempt record due to invalid email', { email: null });
    consoleWarnSpy.mockRestore();
  });

  it('should skip recording for undefined email', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    await recordLoginAttempt({ email: undefined as any, success: true, reason: 'success' });

    expect(mockDbConnect).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith('[auth] Skipping login attempt record due to invalid email', { email: undefined });
    consoleWarnSpy.mockRestore();
  });

  it('should skip recording for email that is only spaces (empty after trim)', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    await recordLoginAttempt({ email: '   ', success: true, reason: 'success' });

    expect(mockDbConnect).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith('[auth] Skipping login attempt record due to invalid email', { email: '   ' });
    consoleWarnSpy.mockRestore();
  });

  it('should normalize and record email with leading/trailing spaces', async () => {
    const mockCollection = { insertOne: jest.fn().mockResolvedValue({}) };
    mockMongoose.connection.collection.mockReturnValue(mockCollection as any);
    mockDbConnect.mockResolvedValue();

    await recordLoginAttempt({
      email: '  Test@Example.Com  ',
      ip: '192.168.1.1',
      success: true,
      reason: 'success'
    });

    expect(mockDbConnect).toHaveBeenCalled();
    expect(mockCollection.insertOne).toHaveBeenCalledWith({
      email: 'test@example.com', // Normalized (trimmed and lowercased)
      ip: '192.168.1.1',
      success: true,
      reason: 'success',
      createdAt: expect.any(Date)
    });
  });

  it('should handle undefined IP by setting it to null', async () => {
    const mockCollection = { insertOne: jest.fn().mockResolvedValue({}) };
    mockMongoose.connection.collection.mockReturnValue(mockCollection as any);
    mockDbConnect.mockResolvedValue();

    await recordLoginAttempt({ email: 'test@example.com', ip: undefined, success: false, reason: 'invalid_credentials' });

    expect(mockCollection.insertOne).toHaveBeenCalledWith({
      email: 'test@example.com',
      ip: null, // Undefined IP defaults to null
      success: false,
      reason: 'invalid_credentials',
      createdAt: expect.any(Date)
    });
  });

});

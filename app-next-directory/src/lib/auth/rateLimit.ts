import { Ratelimit } from '@upstash/ratelimit';
import mongoose from 'mongoose';

import dbConnect from '@/lib/dbConnect';
import { getRedisClient } from '@/lib/redis';

const redis = getRedisClient();

const loginLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      analytics: true,
      prefix: 'auth:login',
    })
  : undefined;

export async function enforceLoginRateLimit(identifier: string) {
  if (!loginLimiter) {
    return { success: true };
  }
  try {
    return await loginLimiter.limit(identifier);
  } catch (err) {
    // Fail-open: if Redis/ratelimiter is unavailable or misconfigured,
    // do NOT block user logins. Log for observability and allow the attempt.
    console.warn('[auth] Login ratelimiter error; allowing attempt', err);
    return { success: true } as const;
  }
}

export async function recordLoginAttempt(params: {
  email: string;
  ip?: string | null;
  success: boolean;
  reason: 'success' | 'invalid_credentials' | 'rate_limited';
}) {
  if (!process.env.MONGODB_URI) {
    return;
  }

  try {
    await dbConnect();
    const collection = mongoose.connection.collection('loginAttempts');
    await collection.insertOne({
      email: params.email.toLowerCase(),
      ip: params.ip ?? null,
      success: params.success,
      reason: params.reason,
      createdAt: new Date(),
    });
  } catch (error) {
    console.warn('[auth] Failed to record login attempt', error);
  }
}

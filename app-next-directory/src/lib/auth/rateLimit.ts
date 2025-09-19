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

export async function enforceLoginRateLimit(identifier: string): Promise<{ success: boolean; limit?: number; remaining?: number; reset?: number }> {

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

  // NOTE: Basic pattern check is enough for logging-only retention. For hardened
  // production flows prefer validator.js isEmail + length caps, consider MX lookups,
  // and block disposable domains before writing audit artifacts.
  const rawEmail = params?.email;
  const isValidEmail = typeof rawEmail === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(rawEmail.trim());
  if (!isValidEmail) {
    console.warn('[auth] Skipping login attempt record due to invalid email', { email: rawEmail });
    return;
  }

  const normalizedEmail = rawEmail.trim().toLowerCase();

  try {
    await dbConnect();
    const collection = mongoose.connection.collection('loginAttempts');
    await collection.insertOne({
      email: normalizedEmail,
      ip: params.ip ?? null,
      success: params.success,
      reason: params.reason,
      createdAt: new Date(),
    });
  } catch (error) {
    console.warn('[auth] Failed to record login attempt', error);
  }
}

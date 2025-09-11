import { NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import PasswordResetToken from '@/models/PasswordResetToken';
import { hashToken } from '@/lib/tokens';
import { getClientIp, isRateLimited, getRetryAfterMs } from '@/lib/rate-limit';
import mongoose from 'mongoose';

const Schema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(128),
});

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const requestId =
      req.headers.get('x-request-id') ||
      req.headers.get('x-trace-id') ||
      req.headers.get('x-vercel-id') ||
      req.headers.get('traceparent') ||
      undefined;
    const key = `auth:reset:${ip}`;
    if (isRateLimited(key, 5, 60)) {
      // Audit: rate limited
      console.log('[AUDIT] password_reset', {
        outcome: 'failure',
        reason: 'rate_limited',
        ip,
        requestId,
        at: new Date().toISOString(),
      });
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(getRetryAfterMs(key) / 1000)) } });
    }
    if (!process.env.MONGODB_URI) {
      // Audit: server misconfiguration
      console.log('[AUDIT] password_reset', {
        outcome: 'failure',
        reason: 'server_not_configured',
        ip,
        requestId,
        at: new Date().toISOString(),
      });
      return NextResponse.json({ error: 'Server not configured (db)' }, { status: 500 });
    }
    await dbConnect();
    // Validate content type
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // Audit: invalid content type
      console.log('[AUDIT] password_reset', {
        outcome: 'failure',
        reason: 'invalid_content_type',
        ip,
        requestId,
        at: new Date().toISOString(),
      });
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }
    
    const body = await req.json();
    const { token, password } = Schema.parse(body);
    const tokenHash = hashToken(token);
    // Only accept non-expired tokens; TTL may lag, so enforce at query-time
    const doc = await PasswordResetToken.findOne({ tokenHash, expiresAt: { $gt: new Date() } }).lean();
    
    // Check both conditions but always return the same error
    const isValid = doc && (!doc.expiresAt || new Date(doc.expiresAt).getTime() >= Date.now());
    
    if (!isValid) {
      // Consider adding a small artificial delay here to normalize response times
      // Audit: invalid or expired token
      console.log('[AUDIT] password_reset', {
        outcome: 'failure',
        reason: 'invalid_or_expired_token',
        userId: doc?.userId ?? null,
        ip,
        requestId,
        at: new Date().toISOString(),
      });
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }
    // Update password with pre-save hook (hashing)
    const u = await User.findById(doc.userId).select('+password');
    if (!u) {
      // Audit: user not found
      console.log('[AUDIT] password_reset', {
        outcome: 'failure',
        reason: 'user_not_found',
        userId: doc.userId,
        ip,
        requestId,
        at: new Date().toISOString(),
      });
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Ensure password field is writable and properly typed
    if (!('password' in u) || typeof u.password !== 'string') {
      throw new Error('User model password field is not accessible');
    }
    // Use a transaction to ensure atomicity
    const session = await User.startSession();
    try {
      await session.withTransaction(async () => {
        u.set('password', password);
        await u.save({ session });
        await PasswordResetToken.deleteOne({ _id: doc._id }).session(session);
      });
    } finally {
      await session.endSession();
    }
    // Audit: success (do NOT log passwords or secrets)
    console.log('[AUDIT] password_reset', {
      outcome: 'success',
      userId: doc.userId,
      ip,
      requestId,
      at: new Date().toISOString(),
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    // Log the actual error for debugging
    console.error('Password reset error:', err);
    
    // Return generic error to client
    if (err instanceof z.ZodError) {
      // Audit: bad request body
      console.log('[AUDIT] password_reset', {
        outcome: 'failure',
        reason: 'invalid_request_data',
        ip: getClientIp(req),
        requestId:
          req.headers.get('x-request-id') ||
          req.headers.get('x-trace-id') ||
          req.headers.get('x-vercel-id') ||
          req.headers.get('traceparent') ||
          undefined,
        at: new Date().toISOString(),
      });
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    // Audit: generic failure
    console.log('[AUDIT] password_reset', {
      outcome: 'failure',
      reason: 'exception',
      errorName: err?.name,
      ip: getClientIp(req),
      requestId:
        req.headers.get('x-request-id') ||
        req.headers.get('x-trace-id') ||
        req.headers.get('x-vercel-id') ||
        req.headers.get('traceparent') ||
        undefined,
      at: new Date().toISOString(),
    });
    return NextResponse.json({ error: 'Password reset failed' }, { status: 500 });
  }
}

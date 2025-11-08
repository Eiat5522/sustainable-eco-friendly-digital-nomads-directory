import { NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import PasswordResetToken from '@/models/PasswordResetToken';
import { hashToken } from '@/lib/tokens';
import { getClientIp, isRateLimited, getRetryAfterMs } from '@/lib/rate-limit';
import { structuredLogger, getRequestContext } from '@/lib/logger';

type PasswordResetAudit = {
  outcome: 'success' | 'failure';
  reason?:
    | 'rate_limited'
    | 'server_not_configured'
    | 'invalid_content_type'
    | 'invalid_or_expired_token'
    | 'user_not_found'
    | 'invalid_request_data'
    | 'exception';
  ip?: string;
  requestId?: string;
  at: string;
  userId?: string;
  errorName?: string;
};

const logAuditEvent = (payload: PasswordResetAudit) => {
  const context = {
    component: 'auth',
    event: 'password_reset',
    ...payload,
  };

  if (typeof structuredLogger.info === 'function') {
    structuredLogger.info('password_reset audit', context);
  } else if (process.env.NODE_ENV === 'test') {
    console.info('password_reset audit', context);
  }
};

const getRequestId = (req: Request): string | undefined =>
  req.headers.get('x-request-id') ||
  req.headers.get('x-trace-id') ||
  req.headers.get('x-vercel-id') ||
  req.headers.get('traceparent') ||
  undefined;

const Schema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(128),
});

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const requestId = getRequestId(req);
    const key = `auth:reset:${ip}`;
    if (isRateLimited(key, 5, 60)) {
      // Audit: rate limited
      logAuditEvent({
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
      logAuditEvent({
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
      logAuditEvent({
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
      logAuditEvent({
        outcome: 'failure',
        reason: 'invalid_or_expired_token',
        userId: doc?.userId ? String(doc.userId) : undefined,
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
      logAuditEvent({
        outcome: 'failure',
        reason: 'user_not_found',
        userId: String(doc.userId),
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
    logAuditEvent({
      outcome: 'success',
      userId: String(doc.userId),
      ip,
      requestId,
      at: new Date().toISOString(),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const resolvedError = error instanceof Error ? error : new Error('Unknown error');
    structuredLogger.authError('password reset', resolvedError, {
      ...getRequestContext(req),
      operation: 'reset_password'
    });

    if (error instanceof z.ZodError) {
      // Audit: bad request body
      logAuditEvent({
        outcome: 'failure',
        reason: 'invalid_request_data',
        ip: getClientIp(req),
        requestId: getRequestId(req),
        at: new Date().toISOString(),
      });
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    // Audit: generic failure
    const errorName =
      typeof error === 'object' && error !== null && 'name' in error && typeof (error as { name?: unknown }).name === 'string'
        ? (error as { name: string }).name
        : undefined;

    logAuditEvent({
      outcome: 'failure',
      reason: 'exception',
      errorName,
      ip: getClientIp(req),
      requestId: getRequestId(req),
      at: new Date().toISOString(),
    });
    return NextResponse.json({ error: 'Password reset failed' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import EmailVerificationToken from '@/models/EmailVerificationToken';
import { hashToken } from '@/lib/tokens';
import { getClientIp, isRateLimited, getRetryAfterMs } from '@/lib/rate-limit';
import { structuredLogger, getRequestContext } from '@/lib/logger';

// GET /api/auth/verify?token=...
export async function GET(req: Request) {
  try {
    // Require token param
    const { searchParams } = new URL(req.url);
    const token = (searchParams.get('token') || '').trim();
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login?verified=0', req.url));
    }
    // Rate limit by client IP
    const ip = getClientIp(req);
    const key = `auth:verify:${ip}`;
    if (isRateLimited(key, 10, 60)) {
      const url = new URL('/auth/login?verified=0', req.url);
      url.searchParams.set('limited', Math.ceil(getRetryAfterMs(key) / 1000).toString());
      return NextResponse.redirect(url);
    }

    // Ensure env and DB
    if (!process.env.MONGODB_URI) {
      return NextResponse.redirect(new URL('/auth/login?verified=0', req.url));
    }
    await dbConnect();

    // Validate token
    const tokenHash = hashToken(token);
    const doc = await EmailVerificationToken.findOne({ tokenHash }).lean();
    if (!doc || (doc.expiresAt && new Date(doc.expiresAt).getTime() < Date.now())) {
      return NextResponse.redirect(new URL('/auth/login?verified=0', req.url));
    }

    // Atomically verify account and delete tokens
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await User.updateOne(
          { _id: doc.userId },
          { $set: { emailVerified: new Date() } },
          { session }
        );
        await EmailVerificationToken.deleteMany({ userId: doc.userId }, { session });
      });
    } finally {
      await session.endSession();
    }

    return NextResponse.redirect(new URL('/auth/login?verified=1', req.url));
    }   catch (error) {
        structuredLogger.authError('email verification', error, {
          ...getRequestContext(req),
          token: token ? '[REDACTED]' : undefined
        });
        return NextResponse.redirect(new URL('/auth/login?verified=0', req.url));
    }
}

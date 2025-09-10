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
    const key = `auth:reset:${ip}`;
    if (isRateLimited(key, 5, 60)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(getRetryAfterMs(key) / 1000)) } });
    }
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ error: 'Server not configured (db)' }, { status: 500 });
    }
    await dbConnect();
    const body = await req.json();
    const { token, password } = Schema.parse(body);
    const tokenHash = hashToken(token);
    // Only accept non-expired tokens; TTL may lag, so enforce at query-time
    const doc = await PasswordResetToken.findOne({ tokenHash, expiresAt: { $gt: new Date() } }).lean();
    
    // Check both conditions but always return the same error
    const isValid = doc && (!doc.expiresAt || new Date(doc.expiresAt).getTime() >= Date.now());
    
    if (!isValid) {
      // Consider adding a small artificial delay here to normalize response times
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }
    // Update password with pre-save hook (hashing)
    const u = await User.findById(doc.userId).select('+password');
    if (!u) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    (u as any).password = password;
    // Use a transaction to ensure atomicity
    const session = await User.startSession();
    try {
      await session.withTransaction(async () => {
        await u.save({ session });
        await PasswordResetToken.deleteMany({ userId: doc.userId }).session(session);
      });
    } finally {
      await session.endSession();
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    // Log the actual error for debugging
    console.error('Password reset error:', err);
    
    // Return generic error to client
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Password reset failed' }, { status: 500 });
  }
}

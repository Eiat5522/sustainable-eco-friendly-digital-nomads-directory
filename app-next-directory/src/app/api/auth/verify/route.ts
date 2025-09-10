import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import EmailVerificationToken from '@/models/EmailVerificationToken';
import { hashToken } from '@/lib/tokens';
import { getClientIp, isRateLimited, getRetryAfterMs } from '@/lib/rate-limit';

export async function GET(req: Request) {
  try {
    const ip = getClientIp(req);
    const key = `auth:verify:${ip}`;
    if (isRateLimited(key, 10, 60)) {
      const url = new URL('/auth/login?verified=0', req.url);
      url.searchParams.set('limited', Math.ceil(getRetryAfterMs(key) / 1000).toString());
      return NextResponse.redirect(url);
    }
    if (!process.env.MONGODB_URI) {
      return NextResponse.redirect(new URL('/auth/login?verified=0', req.url));
    }
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token') || '';
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login?verified=0', req.url));
    }
    const tokenHash = hashToken(token);
    const doc = await EmailVerificationToken.findOne({ tokenHash }).lean();
    if (!doc || (doc.expiresAt && new Date(doc.expiresAt).getTime() < Date.now())) {
      return NextResponse.redirect(new URL('/auth/login?verified=0', req.url));
    }
    await User.updateOne({ _id: doc.userId }, { $set: { emailVerified: new Date() } });
    await EmailVerificationToken.deleteMany({ userId: doc.userId });
    return NextResponse.redirect(new URL('/auth/login?verified=1', req.url));
  } catch (e) {
    return NextResponse.redirect(new URL('/auth/login?verified=0', req.url));
  }
}

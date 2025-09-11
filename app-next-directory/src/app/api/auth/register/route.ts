import { NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import EmailVerificationToken from '@/models/EmailVerificationToken';
import { generateToken, minutesFromNow } from '@/lib/tokens';
import { buildVerifyEmail, sendMail } from '@/lib/email';
import { getClientIp, isRateLimited, getRetryAfterMs } from '@/lib/rate-limit';

const RegisterSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const key = `auth:register:${ip}`;
    if (isRateLimited(key, 5, 60)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(getRetryAfterMs(key) / 1000)) } });
    }
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ error: 'Server not configured (db)' }, { status: 500 });
    }
    await dbConnect();
    const body = await req.json();
    const { name, email, password } = RegisterSchema.parse(body);

    const existing = await User.findOne({ email: email.toLowerCase() }).select('+password').lean();
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    let user;
    try {
      user = await User.create({ name, email, password, emailVerified: null });
    } catch (e: any) {
      if (e?.code === 11000) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
      }
      throw e;
    }

    // Issue verification token
    const { raw, hash } = generateToken();
    await EmailVerificationToken.create({ userId: user._id, tokenHash: hash, expiresAt: minutesFromNow(60 * 24) });

    // Send verification email (best-effort)
    const emailPayload = await buildVerifyEmail(user.email, raw);
    await sendMail(emailPayload).catch((e) => console.error('[email] send verify failed', e));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    const message = err?.message || 'Registration failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

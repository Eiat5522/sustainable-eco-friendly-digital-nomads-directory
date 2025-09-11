import { NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import PasswordResetToken from '@/models/PasswordResetToken';
import { generateToken, minutesFromNow } from '@/lib/tokens';
import { buildResetEmail, sendMail } from '@/lib/email';
import { getClientIp, isRateLimited, getRetryAfterMs } from '@/lib/rate-limit';

const Schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const key = `auth:reset-request:${ip}`;
    if (isRateLimited(key, 5, 60)) {
      return NextResponse.json({ success: true, limited: true }, { status: 200, headers: { 'Retry-After': String(Math.ceil(getRetryAfterMs(key) / 1000)) } });
    }
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ success: true }); // soft success to avoid user enumeration
    }
    await dbConnect();
    const body = await req.json();
    const { email } = Schema.parse(body);
    const user = await User.findOne({ email: email.toLowerCase() }).lean();
    if (!user) {
      // randomized delay to reduce timing side-channel (120–240ms)
      const wait = 120 + Math.floor(Math.random() * 120);
      await new Promise((r) => setTimeout(r, wait));
      return NextResponse.json({ success: true });
    }
    // Additional per-account limit (e.g., 3/hr). No "limited" flag to avoid enumeration.
    const userKey = `auth:reset-request:user:${String(user._id)}`;
    if (isRateLimited(userKey, 3, 3600)) {
      return NextResponse.json({ success: true });
    }
    // Atomically upsert a single token per user to avoid races
    const { raw, hash } = generateToken();
    await PasswordResetToken.updateOne(
      { userId: user._id },
      { $set: { tokenHash: hash, expiresAt: minutesFromNow(60) } },
      { upsert: true }
    );

    const emailPayload = await buildResetEmail(user.email, raw);
    await sendMail(emailPayload).catch((e) => console.error('[email] send reset failed', e));

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: true });
  }
}

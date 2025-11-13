import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Types } from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import PasswordResetToken from '@/models/PasswordResetToken';
import { generateToken, minutesFromNow } from '@/lib/tokens';
import { buildResetEmail, sendMail } from '@/lib/email';
import { getClientIp, isRateLimited, getRetryAfterMs } from '@/lib/rate-limit';
import { structuredLogger, getRequestContext } from '@/lib/logger';

const Schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const key = `auth:reset-request:${ip}`;
    if (await isRateLimited(key, 5, 60)) {
      return NextResponse.json({ success: true, limited: true }, { status: 200, headers: { 'Retry-After': String(Math.ceil(await getRetryAfterMs(key) / 1000)) } });
    }
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ success: true }); // soft success to avoid user enumeration
    }
    await dbConnect();
    const body = await req.json();
    const { email } = Schema.parse(body);
    const user = await User.findOne({ email: email.toLowerCase() }).lean<{
      _id: Types.ObjectId | string;
      email: string;
    }>();
    if (!user) {
      // randomized delay to reduce timing side-channel (120–240ms)
      const wait = 120 + Math.floor(Math.random() * 120);
      await new Promise((r) => setTimeout(r, wait));
      return NextResponse.json({ success: true });
    }
    const userId = typeof user._id === 'string' ? user._id : user._id.toString();
    // Additional per-account limit (e.g., 3/hr). No "limited" flag to avoid enumeration.
    const userKey = `auth:reset-request:user:${userId}`;
    if (await isRateLimited(userKey, 3, 3600)) {
      const wait = 120 + Math.floor(Math.random() * 120);
      await new Promise((r) => setTimeout(r, wait));
      return NextResponse.json({ success: true });
    }
    // Atomically upsert a single token per user to avoid races
    const { raw, hash } = generateToken();
    await PasswordResetToken.updateOne(
      { userId },
      { $set: { tokenHash: hash, expiresAt: minutesFromNow(60) } },
      { upsert: true }
    );

    const emailPayload = await buildResetEmail(user.email, raw);
    await sendMail(emailPayload).catch((e) => 
      structuredLogger.emailError('send password reset email', e, {
        ...getRequestContext(req),
        userId,
        email: user.email // Will be redacted by logger
      })
    );

    return NextResponse.json({ success: true });
  } catch (_err) {
    return NextResponse.json({ success: true });
  }
}

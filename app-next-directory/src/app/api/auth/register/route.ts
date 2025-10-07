import { NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import EmailVerificationToken from '@/models/EmailVerificationToken';
import { getClientIp, isRateLimited, getRetryAfterMs } from '@/lib/rate-limit';
import { structuredLogger, getRequestContext } from '@/lib/logger';
import { generateToken, minutesFromNow } from '@/lib/tokens';
import { buildVerifyEmail, sendMail } from '@/lib/email';
import { isEmailVerificationRequired } from '@/lib/auth/config';

const RegisterSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional(),
  email: z
    .string()
    .trim()
    .min(1)
    .max(320)
    .email()
    .transform((val) => val.toLowerCase()),
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
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await User.findOne({ email: normalizedEmail }).select('+password').lean();
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    const authModule = await import('@/lib/auth/config');
    const authDefault = (authModule as { default?: { isEmailVerificationRequired?: unknown } }).default;
    const isEmailVerificationRequiredFn =
      typeof authModule.isEmailVerificationRequired === 'function'
        ? authModule.isEmailVerificationRequired
        : typeof authDefault?.isEmailVerificationRequired === 'function'
          ? authDefault.isEmailVerificationRequired
          : isEmailVerificationRequired;

    const requiresVerification = Boolean(isEmailVerificationRequiredFn());

    // eslint-disable-next-line no-console
    console.log('[register] typeof User.create:', typeof (User as any)?.create, (User as any)?.create?.mock ? 'has-mock' : 'no-mock');

    let user;
    try {
      user = await User.create({
        name,
        email: normalizedEmail,
        password,
        emailVerified: requiresVerification ? null : new Date(),
      });
    } catch (e: unknown) {
      const code = (e as any)?.code;
      if (code === 11000) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
      }
      throw e;
    }

    if (requiresVerification) {
      const plainUser = typeof (user as any)?.toObject === 'function'
        ? (user as any).toObject()
        : typeof (user as any)?.toJSON === 'function'
          ? (user as any).toJSON()
          : user;

      const userId = plainUser?._id ?? plainUser?.id;

      if (!userId) {
        structuredLogger.warn('registration missing user id for verification token', {
          ...getRequestContext(req),
          email: plainUser?.email ?? normalizedEmail
        });
        return NextResponse.json({ success: true, emailVerificationRequired: true });
      }

      const tokensModule = await import('@/lib/tokens');
      const emailModule = await import('@/lib/email');

      const tokensDefault = (tokensModule as {
        default?: { generateToken?: unknown; minutesFromNow?: unknown };
      }).default;
      const emailDefault = (emailModule as {
        default?: { buildVerifyEmail?: unknown; sendMail?: unknown };
      }).default;

      const generateTokenFn =
        typeof tokensModule.generateToken === 'function'
          ? tokensModule.generateToken
          : typeof tokensDefault?.generateToken === 'function'
            ? tokensDefault.generateToken
            : generateToken;

      const minutesFromNowFn =
        typeof tokensModule.minutesFromNow === 'function'
          ? tokensModule.minutesFromNow
          : typeof tokensDefault?.minutesFromNow === 'function'
            ? tokensDefault.minutesFromNow
            : minutesFromNow;

      const buildVerifyEmailFn =
        typeof emailModule.buildVerifyEmail === 'function'
          ? emailModule.buildVerifyEmail
          : typeof emailDefault?.buildVerifyEmail === 'function'
            ? emailDefault.buildVerifyEmail
            : buildVerifyEmail;

      const sendMailFn =
        typeof emailModule.sendMail === 'function'
          ? emailModule.sendMail
          : typeof emailDefault?.sendMail === 'function'
            ? emailDefault.sendMail
            : sendMail;

      const { raw, hash } = generateTokenFn();
      const expiresAt = minutesFromNowFn(60 * 24);

      await EmailVerificationToken.create({
        userId,
        tokenHash: hash,
        expiresAt,
      });

      const emailPayload = await buildVerifyEmailFn(plainUser?.email ?? normalizedEmail, raw);

      await sendMailFn(emailPayload).catch((error: unknown) =>
        structuredLogger.emailError('send verification email', error, {
          ...getRequestContext(req),
          userId: String(userId),
          email: plainUser?.email ?? normalizedEmail
        })
      );
    }

    return NextResponse.json({ success: true, emailVerificationRequired: requiresVerification });
  } catch (err: any) {
    const message = err?.message || 'Registration failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

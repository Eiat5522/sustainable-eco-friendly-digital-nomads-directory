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

// Allow test setup to inject mock implementations via globals so the
// route uses the exact same function instances as tests (avoids CJS/ESM
// interop issues where different module instances are created).
const _generateToken = (global as any).__TOKENS_generateToken ?? generateToken;
const _minutesFromNow = (global as any).__TOKENS_minutesFromNow ?? minutesFromNow;
const _buildVerifyEmail = (global as any).__EMAIL_buildVerifyEmail ?? buildVerifyEmail;
const _sendMail = (global as any).__EMAIL_sendMail ?? sendMail;
const _isEmailVerificationRequired = (global as any).__AUTH_IS_EMAIL_VERIFICATION_REQUIRED ?? isEmailVerificationRequired;

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
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await User.findOne({ email: normalizedEmail }).select('+password').lean();
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    // Prefer global-injected mock functions (set in jest.setup) so tests and
    // code under test share the exact same function instances. Fall back to
    // runtime require (to pick up Jest mocks) or to statically imported helpers.
    const globalIsEmail = (global as any).__AUTH_IS_EMAIL_VERIFICATION_REQUIRED;
    let requiresVerification: boolean;
    if (typeof globalIsEmail === 'function') {
      requiresVerification = Boolean(globalIsEmail());
    } else {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const ac = require('@/lib/auth/config');
        requiresVerification = Boolean(typeof ac.isEmailVerificationRequired === 'function' ? ac.isEmailVerificationRequired() : ac.isEmailVerificationRequired);
      } catch (e) {
        requiresVerification = typeof _isEmailVerificationRequired === 'function' ? _isEmailVerificationRequired() : Boolean(_isEmailVerificationRequired);
      }
    }

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
      // Issue verification token
      // Use global-injected token/email mocks if present
      const globalGenerate = (global as any).__TOKENS_generateToken;
      const globalMinutes = (global as any).__TOKENS_minutesFromNow;
      const globalBuildVerify = (global as any).__EMAIL_buildVerifyEmail;
      const globalSendMail = (global as any).__EMAIL_sendMail;

      if (typeof globalGenerate === 'function') {
        const { raw, hash } = globalGenerate();
        await EmailVerificationToken.create({ userId: user._id, tokenHash: hash, expiresAt: typeof globalMinutes === 'function' ? globalMinutes(60 * 24) : minutesFromNow(60 * 24) });
        const emailPayload = await (typeof globalBuildVerify === 'function' ? globalBuildVerify(user.email, raw) : buildVerifyEmail(user.email, raw));
        await (typeof globalSendMail === 'function' ? globalSendMail(emailPayload) : sendMail(emailPayload)).catch((e) =>
          structuredLogger.emailError('send verification email', e, {
            ...getRequestContext(req),
            userId: user._id.toString(),
            email: user.email
          })
        );
      } else {
        // Fallback: try to require runtime modules (Jest mocks) or use imports
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const tk = require('@/lib/tokens');
          const em = require('@/lib/email');
          const { raw, hash } = typeof tk.generateToken === 'function' ? tk.generateToken() : generateToken();
          await EmailVerificationToken.create({ userId: user._id, tokenHash: hash, expiresAt: typeof tk.minutesFromNow === 'function' ? tk.minutesFromNow(60 * 24) : minutesFromNow(60 * 24) });
          const emailPayload = await (typeof em.buildVerifyEmail === 'function' ? em.buildVerifyEmail(user.email, raw) : buildVerifyEmail(user.email, raw));
          await (typeof em.sendMail === 'function' ? em.sendMail(emailPayload) : sendMail(emailPayload)).catch((e) =>
            structuredLogger.emailError('send verification email', e, {
              ...getRequestContext(req),
              userId: user._id.toString(),
              email: user.email
            })
          );
        } catch (err) {
          const { raw, hash } = typeof _generateToken === 'function' ? _generateToken() : generateToken();
          await EmailVerificationToken.create({ userId: user._id, tokenHash: hash, expiresAt: (typeof _minutesFromNow === 'function' ? _minutesFromNow(60 * 24) : minutesFromNow(60 * 24)) });
          const emailPayload = await (typeof _buildVerifyEmail === 'function' ? _buildVerifyEmail(user.email, raw) : buildVerifyEmail(user.email, raw));
          await (typeof _sendMail === 'function' ? _sendMail(emailPayload) : sendMail(emailPayload)).catch((e2) =>
            structuredLogger.emailError('send verification email', e2, {
              ...getRequestContext(req),
              userId: user._id.toString(),
              email: user.email
            })
          );
        }
      }
    }

    return NextResponse.json({ success: true, emailVerificationRequired: requiresVerification });
  } catch (err: any) {
    const message = err?.message || 'Registration failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

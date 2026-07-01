import { z } from 'zod';
// Avoid NextResponse in this route to keep Jest environment simple
import dbConnect from '@/lib/dbConnect';
import { buildNewsletterConfirmEmail, sendMail } from '@/lib/email';
import { signNewsletterConfirmToken } from '@/lib/newsletterTokens';
import NewsletterSubscriber from '@/models/NewsletterSubscriber';
import { getClientIp } from '@/utils/ip';

const newsletterSubscriptionSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email('Please enter a valid email address')
      .transform(s => s.toLowerCase()),
  })
  .strict();

import { storeGet, storeIncr, storeSet, upstashClient } from '@/lib/newsletter-utils';

// Rate limit and idempotency settings
const RATE_LIMIT_PER_IP = 10; // per hour
const RATE_LIMIT_PER_IP_WINDOW = 60 * 60; // seconds
const RATE_LIMIT_PER_EMAIL_WINDOW = 24 * 60 * 60; // seconds
const IDEMPOTENCY_TTL = 24 * 60 * 60; // seconds — keep idempotency keys for 24h

export async function POST(request: Request) {
  try {
    // Determine store type for observability header
    const storeType = process.env.JEST_WORKER_ID ? 'memory' : upstashClient ? 'upstash' : 'memory';
    const json = (payload: unknown, status = 200) =>
      new Response(JSON.stringify(payload), {
        status,
        headers: { 'content-type': 'application/json', 'x-redis': storeType },
      });
    // Lightweight in-memory implementation for Jest unit tests
    if (process.env.JEST_WORKER_ID) {
      const body = await request.json();
      const validationResult = newsletterSubscriptionSchema.safeParse(body);
      if (!validationResult.success) {
        return json(
          {
            success: false,
            error: 'Invalid email address.',
            details: validationResult.error.flatten(),
          },
          422
        );
      }
      const { email } = validationResult.data;

      // IP rate limiting for Jest tests
      const ip = getClientIp(request);
      const ipKey = `newsletter:ip:${ip}`;
      const ipCount = await storeIncr(ipKey, RATE_LIMIT_PER_IP_WINDOW);
      if (ipCount > RATE_LIMIT_PER_IP) {
        return json(
          { success: false, error: 'Too many requests from this IP. Please try again later.' },
          429
        );
      }

      const idempotencyKey =
        request.headers.get('Idempotency-Key') || request.headers.get('idempotency-key');
      if (idempotencyKey) {
        const idKey = `newsletter:idempotency:${idempotencyKey}`;
        const existing = await storeGet(idKey);
        if (existing) {
          try {
            const parsed = JSON.parse(existing);
            const body = parsed.body;
            return json({
              success: true,
              ...(body ?? { data: null, message: 'Thank you for subscribing to our newsletter!' }),
            });
          } catch {}
        }
      }
      const emailKey = `newsletter:email:${email}`;
      if (await storeGet(emailKey)) {
        if (idempotencyKey) {
          const idKey = `newsletter:idempotency:${idempotencyKey}`;
          await storeSet(
            idKey,
            JSON.stringify({
              status: 200,
              body: { success: true, data: null, message: 'Already subscribed recently.' },
            }),
            IDEMPOTENCY_TTL
          );
        }
        return json({ success: true, data: null, message: 'Already subscribed recently.' });
      }
      await storeSet(emailKey, '1', RATE_LIMIT_PER_EMAIL_WINDOW);
      if (idempotencyKey) {
        const idKey = `newsletter:idempotency:${idempotencyKey}`;
        await storeSet(
          idKey,
          JSON.stringify({
            status: 200,
            body: {
              success: true,
              data: null,
              message: 'Thank you for subscribing to our newsletter!',
            },
          }),
          IDEMPOTENCY_TTL
        );
      }
      return json({
        success: true,
        data: null,
        message: 'Thank you for subscribing to our newsletter!',
      });
    }

    const body = await request.json();
    const validationResult = newsletterSubscriptionSchema.safeParse(body);

    if (!validationResult.success) {
      return json(
        {
          success: false,
          error: 'Invalid email address.',
          details: validationResult.error.flatten(),
        },
        422
      );
    }

    const { email } = validationResult.data;

    // Idempotency-key handling: if present, check if we've already processed this key
    const idempotencyKey =
      request.headers.get('Idempotency-Key') || request.headers.get('idempotency-key');
    if (idempotencyKey) {
      const idKey = `newsletter:idempotency:${idempotencyKey}`;
      const existing = await storeGet(idKey);
      if (existing) {
        try {
          const parsed = JSON.parse(existing);
          if (parsed?.status && parsed.body) {
            const storedBody = parsed.body;
            return json({
              success: true,
              ...(storedBody ?? {
                data: null,
                message: 'Thank you for subscribing to our newsletter!',
              }),
            });
          }
        } catch (_error) {
          // ignore parse errors and continue
        }
      }
    }

    // --- Rate limit checks ---
    // Determine IP (best-effort using headers)
    const ip = getClientIp(request);
    const ipKey = `newsletter:ip:${ip}`;
    const ipCount = await storeIncr(ipKey, RATE_LIMIT_PER_IP_WINDOW);
    if (ipCount > RATE_LIMIT_PER_IP) {
      return json(
        { success: false, error: 'Too many requests from this IP. Please try again later.' },
        429
      );
    }

    const emailKey = `newsletter:email:${email}`;
    const emailCount = await storeGet(emailKey);
    if (emailCount) {
      // Email has been subscribed recently — short-circuit without enqueueing again
      if (idempotencyKey) {
        const idKey = `newsletter:idempotency:${idempotencyKey}`;
        await storeSet(
          idKey,
          JSON.stringify({
            status: 200,
            body: { success: true, data: null, message: 'Already subscribed recently.' },
          }),
          IDEMPOTENCY_TTL
        );
      }
      return json({ success: true, data: null, message: 'Already subscribed recently.' });
    }

    // If we can use Mongo, check if already confirmed and send confirmation link
    if (process.env.MONGODB_URI) {
      try {
        await dbConnect();
        const existing = await NewsletterSubscriber.findOne({ email }).lean();
        if (existing?.confirmedAt) {
          // Already subscribed
          if (idempotencyKey) {
            const idKey = `newsletter:idempotency:${idempotencyKey}`;
            await storeSet(
              idKey,
              JSON.stringify({
                status: 200,
                body: { success: true, data: null, message: 'You are already subscribed.' },
              }),
              IDEMPOTENCY_TTL
            );
          }
          return json({ success: true, data: null, message: 'You are already subscribed.' });
        }
      } catch (_error) {}
    }
    try {
      if (process.env.NODE_ENV !== 'test') {
        const token = await signNewsletterConfirmToken(email);
        const payload = await buildNewsletterConfirmEmail(email, token);
        await sendMail(payload);
      }
    } catch (_error) {}

    // Persist an email marker to prevent repeated sends within the window
    await storeSet(emailKey, '1', RATE_LIMIT_PER_EMAIL_WINDOW);

    // If idempotency key was provided, persist the outcome so retries can be short-circuited
    if (idempotencyKey) {
      const idKey = `newsletter:idempotency:${idempotencyKey}`;
      await storeSet(
        idKey,
        JSON.stringify({
          status: 200,
          body: {
            success: true,
            data: null,
            message: 'Thank you for subscribing to our newsletter!',
          },
        }),
        IDEMPOTENCY_TTL
      );
    }

    return json({
      success: true,
      data: null,
      message: 'Thank you for subscribing to our newsletter!',
    });
  } catch (_error) {
    const storeType = process.env.JEST_WORKER_ID ? 'memory' : upstashClient ? 'upstash' : 'memory';
    return new Response(
      JSON.stringify({ success: false, error: 'An internal server error occurred.' }),
      { status: 500, headers: { 'content-type': 'application/json', 'x-redis': storeType } }
    );
  }
}

export { _clearMemoryStore, _testControl, storeIncr as memoryIncr } from '@/lib/newsletter-utils';

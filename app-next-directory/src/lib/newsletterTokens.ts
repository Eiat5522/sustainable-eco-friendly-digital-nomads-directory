import { SignJWT, jwtVerify } from 'jose';

const secretString = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || '';
if (!secretString) {
  // Do not throw at import time in SSR; functions will error when called
}

function getKey() {
  if (!secretString) throw new Error('Missing NEXTAUTH_SECRET for newsletter tokens');
  return new TextEncoder().encode(secretString);
}

export async function signNewsletterConfirmToken(email: string): Promise<string> {
  const key = getKey();
  const jwt = await new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
  return jwt;
}

export async function verifyNewsletterConfirmToken(token: string): Promise<{ email: string }> {
  const key = getKey();
  const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
  const email = typeof payload.email === 'string' ? payload.email.trim() : '';
  if (!email) throw new Error('Invalid token payload: missing email');
  return { email };
}


const secretString = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || '';
if (!secretString) {
  // Do not throw at import time in SSR; functions will error when called
}

let joseModulePromise: Promise<typeof import('jose')> | null = null;

async function loadJose() {
  if (!joseModulePromise) {
    joseModulePromise = import('jose');
  }
  return joseModulePromise;
}

function getKey() {
  if (!secretString) {
    throw new Error('Missing newsletter token secret (set NEXTAUTH_SECRET or JWT_SECRET)');
  }
  if (secretString.length < 32) {
    throw new Error('Newsletter token secret must be at least 32 characters for HS256 security');
  }
  return new TextEncoder().encode(secretString);
}

export async function signNewsletterConfirmToken(email: string): Promise<string> {
  const key = getKey();
  const { SignJWT } = await loadJose();
  const jwt = await new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
  return jwt;
}

export async function verifyNewsletterConfirmToken(token: string): Promise<{ email: string }> {
  const key = getKey();
  const { jwtVerify } = await loadJose();
  const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
  const email = typeof payload.email === 'string' ? payload.email.trim() : '';
  if (!email) throw new Error('Invalid token payload: missing email');
  return { email };
}

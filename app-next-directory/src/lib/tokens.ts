import { createHash, randomBytes } from 'node:crypto';

export function generateToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('hex');
  const hash = hashToken(raw);
  return { raw, hash };
}
export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export function minutesFromNow(mins: number): Date {
  return new Date(Date.now() + mins * 60 * 1000);
}

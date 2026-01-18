import { headers } from 'next/headers';
import { structuredLogger } from '@/lib/logger';

export async function getSafeHeaders(): Promise<Awaited<ReturnType<typeof headers>> | null> {
  try {
    return await headers();
  } catch (error) {
    structuredLogger.debug?.('headers() unavailable, using fallback baseUrl', {
      error: error instanceof Error ? { name: error.name, message: error.message } : String(error),
    });
    return null;
  }
}

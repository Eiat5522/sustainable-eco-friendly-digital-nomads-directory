import 'server-only';
import { cookies } from 'next/headers';

export async function getCookieHeader(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map(cookie => `${cookie.name}=${cookie.value}`)
      .join('; ');
    return cookieHeader || null;
  } catch {
    return null;
  }
}

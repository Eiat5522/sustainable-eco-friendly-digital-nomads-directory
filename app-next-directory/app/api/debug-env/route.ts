import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const isE2E = process.env.E2E === '1' || process.env.NEXT_PUBLIC_E2E === '1';

export async function GET() {
  if (process.env.NODE_ENV === 'production' && !isE2E) {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  if (!isE2E) {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '[SET]' : '[NOT SET]',
      NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
      SANITY_API_TOKEN: process.env.SANITY_API_TOKEN ? '[SET]' : '[NOT SET]',
    });
  }

  return NextResponse.json({
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? '',
    NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '',
    NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET ?? '',
    SANITY_API_TOKEN: process.env.SANITY_API_TOKEN ?? '',
  });
}

// app-next-directory/src/app/api/debug-env/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET() {
  // Block in production entirely
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  // Require admin authentication even in development
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    // Never expose actual secrets, only presence indicators
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '[SET]' : '[NOT SET]',
    NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
    SANITY_API_TOKEN: process.env.SANITY_API_TOKEN ? '[SET]' : '[NOT SET]',
  });
}

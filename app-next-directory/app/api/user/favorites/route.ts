import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { client } from '@/lib/sanity/client';
import { hasFeaturePermission, UserRole } from '@/types/auth';

// Get user's favorites
export async function GET() {
  const session = await auth();

  const user = session?.user as { id?: string; role?: UserRole } | undefined;
  const userId: string | undefined = user?.id;
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch user's favorites from Sanity
    const favorites = await client.fetch(
      `*[_type == "userFavorite" && user._ref == $userId] {
        _id,
        listing -> {
          _id,
          name,
          slug,
          mainImage {
            asset -> {
              url
            }
          },
          city -> {
            name
          }
        },
        createdAt
      }`,
      { userId }
    );

    return NextResponse.json({ favorites });
  } catch (error) {
    console.error('Failed to fetch favorites:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
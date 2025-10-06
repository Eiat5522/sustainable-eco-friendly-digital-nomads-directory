
import { NextResponse } from 'next/server';
import { client } from '@/lib/sanity';
import { auth } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await auth();
  const sessionUser = session?.user as {
    id?: string;
    role?: string;
  } | undefined;

  if (sessionUser?.role !== 'venueOwner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    const imageAsset = await client.assets.upload('image', file);

    return NextResponse.json({ asset: imageAsset });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}

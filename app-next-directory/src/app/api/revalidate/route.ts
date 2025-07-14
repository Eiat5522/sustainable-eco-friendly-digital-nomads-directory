import { revalidatePath } from 'next/cache';
import { NextRequest } from 'next/dist/server/web/spec-extension/request';
import { NextResponse } from 'next/dist/server/web/spec-extension/response';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');
    const path = request.nextUrl.searchParams.get('path');

    // Validate the revalidation token
    if (!token || token !== process.env.REVALIDATION_TOKEN) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Validate path parameter
    if (!path) {
      return NextResponse.json(
        { message: 'Missing path parameter' },
        { status: 400 }
      );
    }

    // Revalidate the specific path
    revalidatePath(path);

    return NextResponse.json({
      revalidated: true,
      path,
      now: Date.now()
    });
  } catch (error) {
    console.error('Error revalidating path:', error);
    return NextResponse.json(
      { message: 'Error revalidating' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/dist/server/web/spec-extension/response';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    // Test the connection
    const client = await clientPromise;
    await client.db().command({ ping: 1 });

    return NextResponse.json({
      status: 'success',
      message: 'Successfully connected to MongoDB!'
    });
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to connect to MongoDB'
    }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import clientPromise from '@/lib/mongodb';

export async function updateSessionActivity(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    if (token?.sub) { // sub is the user ID in the JWT
      const client = await clientPromise;
      const db = client.db();

      // Update session activity
      await db.collection('sessions').updateOne(
        { userId: token.sub },
        {
          $set: {
            lastAccessed: new Date(),
            userAgent: request.headers.get('user-agent') || '',
            ipAddress: request.ip || request.headers.get('x-forwarded-for') || ''
          }
        }
      );
    }
  } catch (error) {
    console.error('Error updating session activity:', error);
    // Don't block the request if session update fails
  }

  return NextResponse.next();
}

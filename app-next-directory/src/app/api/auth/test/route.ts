import { auth } from '@/lib/auth';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    const headers = {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Type': 'application/json',
    };

    const responseData = {
      isAuthenticated: !!session,
      user: session?.user || null,
      runtime: process.env.EDGE_RUNTIME ? 'edge' : 'nodejs',
    };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Authentication check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
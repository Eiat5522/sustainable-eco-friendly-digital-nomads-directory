import { GET as authGET, POST as authPOST } from '@/lib/auth';
import { structuredLogger } from '@/lib/logger';

structuredLogger.info('[auth route] module loaded');
if (process.env.NODE_ENV === 'test') {
  console.log('[auth route] module loaded');
}

export async function GET(request: Request) {
  try {
    const { pathname } = new URL(request.url);
    structuredLogger.info('[auth route] incoming GET', { path: pathname });
    if (process.env.NODE_ENV === 'test') {
      console.log('[auth route] incoming GET', pathname);
    }
  } catch (error) {
    const errorForLog = error instanceof Error ? error : new Error(String(error));
    structuredLogger.warn('[auth route] failed to parse GET request URL', {
      component: 'auth',
      error: errorForLog.message,
    });
    if (process.env.NODE_ENV === 'test') {
      console.error('[auth route] failed to parse GET request URL', errorForLog);
    }
    structuredLogger.info('[auth route] incoming GET');
    if (process.env.NODE_ENV === 'test') {
      console.log('[auth route] GET handler called');
    }
  }
  return authGET(request as Parameters<typeof authGET>[0]);
}

export async function POST(request: Request) {
  try {
    const { pathname } = new URL(request.url);
    structuredLogger.info('[auth route] incoming POST', { path: pathname });
    if (process.env.NODE_ENV === 'test') {
      console.log('[auth route] incoming POST', pathname);
    }
  } catch (error) {
    const errorForLog = error instanceof Error ? error : new Error(String(error));
    structuredLogger.warn('[auth route] failed to parse POST request URL', {
      component: 'auth',
      error: errorForLog.message,
    });
    structuredLogger.info('[auth route] incoming POST');
    if (process.env.NODE_ENV === 'test') {
      console.log('[auth route] POST handler called');
    }
  }
  return authPOST(request as Parameters<typeof authPOST>[0]);
}

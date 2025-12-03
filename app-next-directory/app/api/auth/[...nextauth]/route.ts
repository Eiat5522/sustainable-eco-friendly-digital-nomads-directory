import { GET as authGET, POST as authPOST } from '@/lib/auth';
import { structuredLogger } from '@/lib/logger';

structuredLogger.info('[auth route] module loaded');

export async function GET(request: Request) {
  try {
    const { pathname } = new URL(request.url);
    structuredLogger.info('[auth route] incoming GET', { path: pathname });
  } catch (error) {
    const errorForLog = error instanceof Error ? error : new Error(String(error));
    structuredLogger.warn('[auth route] failed to parse GET request URL', {
      component: 'auth',
      error: errorForLog.message,
    });
    structuredLogger.info('[auth route] incoming GET');
  }
  return authGET(request as Parameters<typeof authGET>[0]);
}

export async function POST(request: Request) {
  try {
    const { pathname } = new URL(request.url);
    structuredLogger.info('[auth route] incoming POST', { path: pathname });
  } catch (error) {
    const errorForLog = error instanceof Error ? error : new Error(String(error));
    structuredLogger.warn('[auth route] failed to parse POST request URL', {
      component: 'auth',
      error: errorForLog.message,
    });
    structuredLogger.info('[auth route] incoming POST');
  }
  return authPOST(request as Parameters<typeof authPOST>[0]);
}

import { NextResponse } from 'next/server';

type ResponseConstructorWithJson = typeof Response & {
  json?: (data: unknown, init?: ResponseInit) => Response;
};

const hasStaticResponseJson =
  typeof Response !== 'undefined' &&
  typeof (Response as ResponseConstructorWithJson).json === 'function';

const canUseNextResponseJson =
  typeof NextResponse !== 'undefined' &&
  'json' in NextResponse &&
  typeof NextResponse.json === 'function' &&
  hasStaticResponseJson;

function createJsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers ?? {});
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  if (canUseNextResponseJson) {
    // NextResponse.json internally calls Response.json which is missing in the test
    // environment. We guard the call so that unit tests fall back to the standard
    // Response constructor while production still benefits from Next.js helpers.
    // If a non-200 status is requested, prefer the standard Response so the
    // status is preserved reliably in test environments.
    if (init.status && init.status !== 200) {
      const payload = JSON.stringify(body ?? null);
      return new Response(payload, { ...init, headers });
    }

    return NextResponse.json(body, { ...init, headers });
  }

  const payload = JSON.stringify(body ?? null);

  return new Response(payload, {
    ...init,
    headers,
  });
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: unknown;
}

export const ApiResponseHandler = {
  success: <T>(data: T, message?: string) => {
    const payload: ApiResponse<T> =
      message === undefined ? { success: true, data } : { success: true, data, message };
    return createJsonResponse(payload);
  },
  error: (error: string, status: number = 400, details?: unknown) => {
    const payload: ApiResponse<never> & { details?: unknown } = { success: false, error };

    if (details !== undefined) {
      payload.details = details;
    }

    return createJsonResponse(payload, { status });
  },

  notFound(resource?: string) {
    const msg = resource ? `${resource} not found` : 'Resource not found';
    return createJsonResponse({ success: false, error: msg }, { status: 404 });
  },

  unauthorized() {
    return createJsonResponse({ success: false, error: 'Unauthorized access' }, { status: 401 });
  },

  forbidden() {
    return createJsonResponse({ success: false, error: 'Forbidden' }, { status: 403 });
  },
};

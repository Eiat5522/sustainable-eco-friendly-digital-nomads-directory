import { NextResponse } from 'next/server';

type JsonBody =
  | Record<string, unknown>
  | Array<unknown>
  | string
  | number
  | boolean
  | null
  | undefined;

const hasStaticResponseJson =
  typeof Response !== 'undefined' && typeof (Response as any).json === 'function';

const canUseNextResponseJson =
  typeof NextResponse !== 'undefined' && typeof (NextResponse as any).json === 'function' && hasStaticResponseJson;

function createJsonResponse(body: JsonBody, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers ?? {});
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  if (canUseNextResponseJson) {
    // NextResponse.json internally calls Response.json which is missing in the test
    // environment. We guard the call so that unit tests fall back to the standard
    // Response constructor while production still benefits from Next.js helpers.
    return NextResponse.json(body, { ...init, headers });
  }

  const payload = typeof body === 'string' ? body : JSON.stringify(body ?? {});

  return new Response(payload, {
    ...init,
    headers,
  });
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

export const ApiResponseHandler = {
  success: (data: any, message?: string) => {
    const payload = message === undefined ? { success: true, data } : { success: true, data, message };
    return createJsonResponse(payload);
  },

  error: (
    error: string,
    status: number = 400,
    details?: unknown
  ) => {
    const payload: any = { success: false, error };
    if (details !== undefined) payload.details = details;
    return createJsonResponse(payload, { status });
  },

  notFound: (resource?: string) => {
    const msg = resource ? `${resource} not found` : 'Resource not found';
    return createJsonResponse({ success: false, error: msg }, { status: 404 });
  },

  unauthorized: () => {
    return createJsonResponse({ success: false, error: 'Unauthorized access' }, { status: 401 });
  },

  forbidden: () => {
    return createJsonResponse({ success: false, error: 'Forbidden' }, { status: 403 });
  },
};

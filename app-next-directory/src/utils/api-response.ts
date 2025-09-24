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

function createJsonResponse(body: JsonBody, init?: ResponseInit) {
  const headers = new Headers(init?.headers ?? {});
  if (!headers.has('content-type')) headers.set('content-type', 'application/json');

  if (typeof NextResponse?.json === 'function') {
    return NextResponse.json(body, { ...init, headers });
  }

  const status = init?.status ?? 200;
  const ok = status >= 200 && status < 300;
  const textValue = typeof body === 'string' ? body : JSON.stringify(body ?? {});
  const jsonValue =
    typeof body === 'string'
      ? (() => {
          try {
            return JSON.parse(body);
          } catch {
            return body;
          }
        })()
      : body ?? {};

  return {
    status,
    headers,
    ok,
    text: () => Promise.resolve(textValue),
    json: () => Promise.resolve(jsonValue),
  } as Response;
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
    return createJsonResponse(
      { success: false, error: msg },
      { status: 404 }
    );
  },

  unauthorized: () => {
    return createJsonResponse(
      { success: false, error: 'Unauthorized access' },
      { status: 401 }
    );
  },

  forbidden: () => {
    return createJsonResponse(
      { success: false, error: 'Forbidden' },
      { status: 403 }
    );
  },
};

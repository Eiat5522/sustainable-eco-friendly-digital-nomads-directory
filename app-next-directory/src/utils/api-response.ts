export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

function createJsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers ?? {});
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}

export const ApiResponseHandler = {
  success: (data: any, message?: string) => {
    const payload: ApiResponse = {
      success: true,
      data,
    };

    if (message !== undefined) {
      payload.message = message;
    }

    return createJsonResponse(payload);
  },

  error: (
    error: string,
    status: number = 400,
    details?: unknown
  ) => {
    const payload: ApiResponse = { success: false, error };
    if (details !== undefined) {
      payload.details = details;
    }

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

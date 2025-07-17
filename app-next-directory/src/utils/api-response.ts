import { NextResponse } from 'next/dist/server/web/spec-extension/response';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

export const ApiResponseHandler = {
  success: (data: any, message?: string) => {
    return NextResponse.json(
      { success: true, data, message }
    );
  },

  error: (
    error: string,
    status: number = 400,
    details?: unknown
  ) => {
    const payload: any = { success: false, error };
    if (details !== undefined) payload.details = details;
    return NextResponse.json(payload, { status });
  },

  notFound: (resource?: string) => {
    const msg = resource ? `${resource} not found` : 'Resource not found';
    return NextResponse.json(
      { success: false, error: msg },
      { status: 404 }
    );
  },

  unauthorized: () => {
    return NextResponse.json(
      { success: false, error: 'Unauthorized access' },
      { status: 401 }
    );
  },

  forbidden: () => {
    return NextResponse.json(
      { success: false, error: 'Forbidden' },
      { status: 403 }
    );
  },
};

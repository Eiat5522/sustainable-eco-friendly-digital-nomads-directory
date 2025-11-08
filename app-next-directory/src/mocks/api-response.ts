import { jest } from '@jest/globals';

type SuccessResponse<T = unknown> =
  | { success: true; data: T }
  | { success: true; data: T; message: string };

type ErrorResponse = { success: false; error: string; code: number };

type PaginatedResponse<T = unknown> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

type SimpleMock<F extends (...args: unknown[]) => unknown> = F & {
  mock: {
    calls: unknown[];
  };
};

type ApiResponseHandlerMocks = {
  success: SimpleMock<(data: unknown, message?: string) => SuccessResponse<unknown>>;
  error: SimpleMock<(message: string, code?: number) => ErrorResponse>;
  paginated: SimpleMock<(items: unknown[], page?: number, limit?: number) => PaginatedResponse<unknown>>;
};

export const ApiResponseHandler: ApiResponseHandlerMocks = {
  success: jest.fn<(data: unknown, message?: string) => SuccessResponse<unknown>>((data, message) => {
    return message === undefined ? { success: true, data } : { success: true, data, message };
  }),

  error: jest.fn<(message: string, code?: number) => ErrorResponse>((message, code = 400) => ({
    success: false,
    error: message,
    code,
  })),

  paginated: jest.fn<(items: unknown[], page?: number, limit?: number) => PaginatedResponse<unknown>>(
    (items, page = 1, limit = 10) => ({
      data: items,
      pagination: {
        page,
        limit,
        total: items.length,
        pages: Math.ceil(items.length / limit),
      },
    })
  ),
};

export default ApiResponseHandler;

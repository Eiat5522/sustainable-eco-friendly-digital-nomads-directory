import { jest } from '@jest/globals';

type SuccessResponse<T = any> =
  | { success: true; data: T }
  | { success: true; data: T; message: string };

type ErrorResponse = { success: false; error: string; code: number };

type PaginatedResponse<T = any> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export const ApiResponseHandler = {
  success: jest.fn<(data: any, message?: string) => SuccessResponse<any>>((data, message) => {
    return message === undefined ? { success: true, data } : { success: true, data, message };
  }),

  error: jest.fn<(message: string, code?: number) => ErrorResponse>((message, code = 400) => ({
    success: false,
    error: message,
    code,
  })),

  paginated: jest.fn<(items: any[], page?: number, limit?: number) => PaginatedResponse<any>>(
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

export default ApiResponseHandler

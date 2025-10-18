// Jest typed mocks for API responses used in tests.
type MockJson = { json: () => Promise<Record<string, unknown>> };

const createMockResponse = (status: number, payload: Record<string, unknown>): { status: number } & MockJson => ({
  status,
  json: () => Promise.resolve(payload),
});

export const ApiResponseHandler = {
  success: jest.fn((data: unknown, message?: string) =>
    Promise.resolve(
      createMockResponse(200, {
        success: true,
        data,
        ...(message ? { message } : {}),
      }),
    ),
  ),
  error: jest.fn((message: string, status = 400, details?: unknown) =>
    Promise.resolve(
      createMockResponse(status, {
        error: message,
        ...(details ? { details } : {}),
      }),
    ),
  ),
  notFound: jest.fn((resource = 'Not Found') =>
    Promise.resolve(createMockResponse(404, { error: resource })),
  ),
  unauthorized: jest.fn((message = 'Unauthorized') =>
    Promise.resolve(createMockResponse(401, { error: message })),
  ),
  forbidden: jest.fn((message = 'Forbidden') =>
    Promise.resolve(createMockResponse(403, { error: message })),
  ),
};

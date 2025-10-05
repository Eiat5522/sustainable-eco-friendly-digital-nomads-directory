export const ApiResponseHandler = {
  success: jest.fn((data: unknown) => Promise.resolve({ status: 200, json: () => Promise.resolve({ success: true, data }) })),
  error: jest.fn((message: string, status: number = 400) => Promise.resolve({ status, json: () => Promise.resolve({ error: message }) })),
  notFound: jest.fn((message = 'Not Found') => Promise.resolve({ status: 404, json: () => Promise.resolve({ error: message }) })),
  unauthorized: jest.fn((message = 'Unauthorized') => Promise.resolve({ status: 401, json: () => Promise.resolve({ error: message }) })),
  forbidden: jest.fn((message = 'Forbidden') => Promise.resolve({ status: 403, json: () => Promise.resolve({ error: message }) })),
};
export const ApiResponseHandler = {
  success: jest.fn((data: any) => ({ success: true, data })),
  error: jest.fn((message: string, code = 400) => ({ success: false, error: message, code })),
  paginated: jest.fn((items: any[], page = 1, limit = 10) => ({
    data: items,
    pagination: {
      page,
      limit,
      total: items.length,
      pages: Math.ceil(items.length / limit)
    }
  }))
}

export default ApiResponseHandler

const ApiResponseHandler = {
  success: jest.fn(),
  error: jest.fn(),
  notFound: jest.fn(),
  forbidden: jest.fn(),
  unauthorized: jest.fn(),
};

module.exports = { ApiResponseHandler };
import { describe, it, expect, jest, beforeEach, beforeAll } from '@jest/globals';
import { NextResponse } from 'next/server';
import { ApiResponseHandler } from '../api-response';

// Mock NextResponse
jest.mock('next/server', () => {
  const actualNextResponse: typeof import('next/server') = jest.requireActual('next/server');
  return {
    NextResponse: {
      ...actualNextResponse.NextResponse,
      json: jest.fn((data, init) => {
        // Create a real Response object to accurately simulate NextResponse.json's return
        const response = new Response(JSON.stringify(data), { status: init?.status });
        // Add a mock to its json() method for inspection in tests
        response.json = jest.fn(() => Promise.resolve(data));
        return response;
      }),
    },
  };
});

// Mock global Response.json to avoid TypeError if called accidentally
beforeAll(() => {
  // @ts-ignore
  global.Response = {
    json: jest.fn(),
  };
});

describe('ApiResponseHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('success', () => {
    it('should create a successful response with data', () => {
      const testData = { id: 1, name: 'Test' };
      const message = 'Success message';

      ApiResponseHandler.success(testData, message);

      expect(NextResponse.json).toHaveBeenCalledWith({
        success: true,
        data: testData,
        message,
      });
    });

    it('should create a successful response without message', () => {
      const testData = { id: 1, name: 'Test' };

      ApiResponseHandler.success(testData);

      expect(NextResponse.json).toHaveBeenCalledWith({
        success: true,
        data: testData,
        message: undefined,
      });
    });

    it('should handle null data', () => {
      ApiResponseHandler.success(null);

      expect(NextResponse.json).toHaveBeenCalledWith({
        success: true,
        data: null,
        message: undefined,
    });
  });

  it('should call NextResponse.json with correct arguments', () => {
    const testData = { id: 1, name: 'Test' };
    const message = 'Success message';
    ApiResponseHandler.success(testData, message);
    expect(NextResponse.json).toHaveBeenCalledWith({
      success: true,
      data: testData,
      message,
    });
  });

  it('should call NextResponse.json with correct arguments and return the correct value', async () => {
    const testData = { id: 1, name: 'Test' };
    const message = 'Success message';
    const result = ApiResponseHandler.success(testData, message);
    expect(NextResponse.json).toHaveBeenCalledWith({
      success: true,
      data: testData,
      message,
    });
    expect(await result.json()).toEqual({
      success: true,
      data: testData,
      message,
    });
    expect(result.status).toBe(200); // Default status for success is 200
  });
});

  describe('error', () => {
    it('should create an error response with default status 400', () => {
      const errorMessage = 'Something went wrong';

      ApiResponseHandler.error(errorMessage);

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          success: false,
          error: errorMessage,
        },
        { status: 400 }
      );
    });

    it('should create an error response with custom status', () => {
      const errorMessage = 'Server error';
      const status = 500;

      ApiResponseHandler.error(errorMessage, status);

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          success: false,
          error: errorMessage,
        },
        { status }
      );
    });

    it('should include details when provided', () => {
      const errorMessage = 'Validation error';
      const status = 422;
      const details = { field: 'email', message: 'Invalid format' };

      ApiResponseHandler.error(errorMessage, status, details);

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          success: false,
          error: errorMessage,
          details,
        },
        { status }
      );
    });
  });

  describe('notFound', () => {
    it('should create a 404 response with default message', () => {
      ApiResponseHandler.notFound();

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          success: false,
          error: 'Resource not found',
        },
        { status: 404 }
      );
    });

    it('should create a 404 response with custom resource name', () => {
      const resource = 'User';

      ApiResponseHandler.notFound(resource);

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    });
  });

  describe('unauthorized', () => {
    it('should create a 401 response', () => {
      ApiResponseHandler.unauthorized();

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          success: false,
          error: 'Unauthorized access',
        },
        { status: 401 }
      );
    });
  });

  describe('forbidden', () => {
    it('should create a 403 response', () => {
      ApiResponseHandler.forbidden();

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          success: false,
          error: 'Forbidden',
        },
        { status: 403 }
      );
    });
  });
});

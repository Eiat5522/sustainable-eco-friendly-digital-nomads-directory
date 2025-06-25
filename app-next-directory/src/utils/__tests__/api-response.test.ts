import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextResponse } from 'next/server';
import { ApiResponseHandler } from '../api-response';

// Mock NextResponse
jest.mock('next/server', () => {
  return {
    NextResponse: {
      json: jest.fn().mockImplementation((data, init) => {
        const response: { data: any; status?: number } = {
          data: data,
          status: init?.status,
        };
        return response as any;
      }),
    },
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

  it('should call NextResponse.json with correct arguments and return the correct value', () => {
    const testData = { id: 1, name: 'Test' };
    const message = 'Success message';
    const result = ApiResponseHandler.success(testData, message);
    expect(NextResponse.json).toHaveBeenCalledWith({
      success: true,
      data: testData,
      message,
    });
    expect(result).toEqual({
      data: testData,
      status: undefined,
    });
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

/**
 * Test suite for mock factories used in middleware tests
 * Validates proper creation of mock requests, responses, and Next.js response objects
 */

import { describe, it, expect, jest } from '@jest/globals';
import { makeMockRequest, makeMockResponse, makeMockNextResponse } from './factories';

describe('Mock Factories', () => {
  describe('makeMockRequest', () => {
    it('should create a mock request with correct pathname', () => {
      const mockRequest = makeMockRequest('/auth/signin');

      expect(mockRequest.nextUrl.pathname).toBe('/auth/signin');
    });

    it('should create a mock request with full URL', () => {
      const mockRequest = makeMockRequest('/dashboard');

      expect(mockRequest.url).toBe('https://example.com/dashboard');
    });

    it('should handle root path', () => {
      const mockRequest = makeMockRequest('/');

      expect(mockRequest.nextUrl.pathname).toBe('/');
      expect(mockRequest.url).toBe('https://example.com/');
    });

    it('should handle nested paths', () => {
      const mockRequest = makeMockRequest('/api/auth/callback');

      expect(mockRequest.nextUrl.pathname).toBe('/api/auth/callback');
      expect(mockRequest.url).toBe('https://example.com/api/auth/callback');
    });

    it('should handle paths with query parameters', () => {
      const mockRequest = makeMockRequest('/search?q=test');

      expect(mockRequest.nextUrl.pathname).toBe('/search?q=test');
      expect(mockRequest.url).toBe('https://example.com/search?q=test');
    });

    it('should handle paths with special characters', () => {
      const mockRequest = makeMockRequest('/listings/café-nomad');

      expect(mockRequest.nextUrl.pathname).toBe('/listings/café-nomad');
    });

    it('should handle protected routes', () => {
      const mockRequest = makeMockRequest('/admin/dashboard');

      expect(mockRequest.nextUrl.pathname).toBe('/admin/dashboard');
      expect(mockRequest.url).toContain('/admin/dashboard');
    });

    it('should handle paths with multiple segments', () => {
      const mockRequest = makeMockRequest('/users/123/profile/edit');

      expect(mockRequest.nextUrl.pathname).toBe('/users/123/profile/edit');
    });
  });

  describe('makeMockResponse', () => {
    it('should create a mock response with headers', () => {
      const mockResponse = makeMockResponse();

      expect(mockResponse.headers).toBeDefined();
      expect(mockResponse.headers.set).toBeDefined();
      expect(typeof mockResponse.headers.set).toBe('function');
    });

    it('should create a mock response with extra properties', () => {
      const mockResponse = makeMockResponse({
        status: 200,
        statusText: 'OK'
      });

      expect(mockResponse.status).toBe(200);
      expect(mockResponse.statusText).toBe('OK');
    });

    it('should allow header set to be called', () => {
      const mockResponse = makeMockResponse();
      
      mockResponse.headers.set('Content-Type', 'application/json');

      expect(mockResponse.headers.set).toHaveBeenCalledWith('Content-Type', 'application/json');
    });

    it('should create response with empty extra properties', () => {
      const mockResponse = makeMockResponse({});

      expect(mockResponse.headers).toBeDefined();
      expect(mockResponse.headers.set).toBeDefined();
    });

    it('should create response with custom properties', () => {
      const mockResponse = makeMockResponse({
        ok: true,
        redirected: false,
        type: 'basic'
      });

      expect(mockResponse.ok).toBe(true);
      expect(mockResponse.redirected).toBe(false);
      expect(mockResponse.type).toBe('basic');
    });

    it('should track multiple header set calls', () => {
      const mockResponse = makeMockResponse();
      
      mockResponse.headers.set('Content-Type', 'application/json');
      mockResponse.headers.set('Cache-Control', 'no-cache');

      expect(mockResponse.headers.set).toHaveBeenCalledTimes(2);
    });

    it('should create independent mock responses', () => {
      const response1 = makeMockResponse({ status: 200 });
      const response2 = makeMockResponse({ status: 404 });

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(404);
    });
  });

  describe('makeMockNextResponse', () => {
    it('should create a NextResponse mock with redirect function', () => {
      const mockNextResponse = makeMockNextResponse();

      expect(mockNextResponse.redirect).toBeDefined();
      expect(typeof mockNextResponse.redirect).toBe('function');
    });

    it('should create a NextResponse mock with next function', () => {
      const mockNextResponse = makeMockNextResponse();

      expect(mockNextResponse.next).toBeDefined();
      expect(typeof mockNextResponse.next).toBe('function');
    });

    it('should create a NextResponse mock with json function', () => {
      const mockNextResponse = makeMockNextResponse();

      expect(mockNextResponse.json).toBeDefined();
      expect(typeof mockNextResponse.json).toBe('function');
    });

    it('should expose internal mocks via _mocks', () => {
      const mockNextResponse = makeMockNextResponse();

      expect(mockNextResponse._mocks).toBeDefined();
      expect(mockNextResponse._mocks.mockRedirect).toBeDefined();
      expect(mockNextResponse._mocks.mockNext).toBeDefined();
      expect(mockNextResponse._mocks.mockJson).toBeDefined();
    });

    it('should allow redirect to be called', () => {
      const mockNextResponse = makeMockNextResponse();
      
      mockNextResponse.redirect('https://example.com/login');

      expect(mockNextResponse._mocks.mockRedirect).toHaveBeenCalledWith('https://example.com/login');
    });

    it('should return mock response from redirect', () => {
      const mockNextResponse = makeMockNextResponse();
      
      const result = mockNextResponse.redirect('/auth/signin');

      expect(result.headers).toBeDefined();
      expect(result.headers.set).toBeDefined();
    });

    it('should allow next to be called', () => {
      const mockNextResponse = makeMockNextResponse();
      
      mockNextResponse.next();

      expect(mockNextResponse._mocks.mockNext).toHaveBeenCalled();
    });

    it('should return mock response from next', () => {
      const mockNextResponse = makeMockNextResponse();
      
      const result = mockNextResponse.next();

      expect(result.headers).toBeDefined();
    });

    it('should allow json to be called with data', () => {
      const mockNextResponse = makeMockNextResponse();
      const jsonData = { success: true, message: 'OK' };
      
      mockNextResponse.json(jsonData);

      expect(mockNextResponse._mocks.mockJson).toHaveBeenCalledWith(jsonData);
    });

    it('should return mock response from json', () => {
      const mockNextResponse = makeMockNextResponse();
      
      const result = mockNextResponse.json({ error: 'Not found' });

      expect(result.headers).toBeDefined();
    });

    it('should track multiple redirect calls', () => {
      const mockNextResponse = makeMockNextResponse();
      
      mockNextResponse.redirect('/login');
      mockNextResponse.redirect('/signup');

      expect(mockNextResponse._mocks.mockRedirect).toHaveBeenCalledTimes(2);
    });

    it('should track multiple next calls', () => {
      const mockNextResponse = makeMockNextResponse();
      
      mockNextResponse.next();
      mockNextResponse.next();

      expect(mockNextResponse._mocks.mockNext).toHaveBeenCalledTimes(2);
    });

    it('should track mixed method calls', () => {
      const mockNextResponse = makeMockNextResponse();
      
      mockNextResponse.redirect('/auth');
      mockNextResponse.next();
      mockNextResponse.json({ data: 'test' });

      expect(mockNextResponse._mocks.mockRedirect).toHaveBeenCalledTimes(1);
      expect(mockNextResponse._mocks.mockNext).toHaveBeenCalledTimes(1);
      expect(mockNextResponse._mocks.mockJson).toHaveBeenCalledTimes(1);
    });

    it('should create independent NextResponse mocks', () => {
      const mock1 = makeMockNextResponse();
      const mock2 = makeMockNextResponse();
      
      mock1.redirect('/path1');
      mock2.redirect('/path2');

      expect(mock1._mocks.mockRedirect).not.toBe(mock2._mocks.mockRedirect);
    });
  });
});

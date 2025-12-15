import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockedGetSearchSuggestions = jest.fn();

// Mock the search helper used by the route instead of mutating _testControl
jest.mock('@/lib/search', () => ({ getSearchSuggestions: mockedGetSearchSuggestions }));

let GET: any;

describe('/api/search/suggestions', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(async () => {
    jest.resetModules();
    mockedGetSearchSuggestions.mockReset();
    // require route after mocks are set

    GET = require('../route').GET;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('returns suggestions for valid query', async () => {
    const mockSuggestions = [
      { text: 'Bangkok', type: 'city' },
      { text: 'Bali', type: 'city' },
    ];
    mockedGetSearchSuggestions.mockResolvedValue(mockSuggestions);

    const request = new Request('http://localhost:3000/api/search/suggestions?q=Ban');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.suggestions).toEqual(mockSuggestions);
    expect(mockedGetSearchSuggestions).toHaveBeenCalledWith('Ban');
  });

  it('returns 400 when query parameter is missing', async () => {
    const request = new Request('http://localhost:3000/api/search/suggestions');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Missing required query param "q"');
    expect(json.details?.code).toBe('MISSING_QUERY');
    expect(json.details?.param).toBe('q');
    expect(mockedGetSearchSuggestions).not.toHaveBeenCalled();
  });

  it('returns 400 when query is empty after trim', async () => {
    const request = new Request('http://localhost:3000/api/search/suggestions?q=   ');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Missing required query param "q"');
    expect(mockedGetSearchSuggestions).not.toHaveBeenCalled();
  });

  it('returns 400 when query is too long', async () => {
    const longQuery = 'a'.repeat(300);
    const request = new Request(`http://localhost:3000/api/search/suggestions?q=${longQuery}`);
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Query too long');
    expect(json.details?.code).toBe('QUERY_TOO_LONG');
    expect(json.details?.maxLength).toBe(256);
    expect(mockedGetSearchSuggestions).not.toHaveBeenCalled();
  });

  it('handles errors from suggestion service', async () => {
    mockedGetSearchSuggestions.mockRejectedValue(new Error('Database connection failed'));

    const request = new Request('http://localhost:3000/api/search/suggestions?q=test');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Failed to get suggestions');
  });

  it('includes error details in non-production', async () => {
    process.env.NODE_ENV = 'development';
    mockedGetSearchSuggestions.mockRejectedValue(new Error('Specific error'));

    const request = new Request('http://localhost:3000/api/search/suggestions?q=test');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.details?.details).toBe('Specific error');
  });

  it('excludes error details in production', async () => {
    process.env.NODE_ENV = 'production';
    mockedGetSearchSuggestions.mockRejectedValue(new Error('Specific error'));

    const request = new Request('http://localhost:3000/api/search/suggestions?q=test');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.details).toBeUndefined();
  });

  it('handles null or undefined from suggestion service', async () => {
    mockedGetSearchSuggestions.mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/search/suggestions?q=test');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.suggestions).toEqual(null);
  });
});

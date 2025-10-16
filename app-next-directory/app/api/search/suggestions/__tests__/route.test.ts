import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { GET } from '../route';
import { getSearchSuggestions } from '@/lib/search';

jest.mock('@/lib/search', () => ({
  getSearchSuggestions: jest.fn(),
}));

describe('/api/search/suggestions', () => {
  let mockedGetSearchSuggestions: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetSearchSuggestions = getSearchSuggestions as jest.Mock;
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
    expect(json.suggestions).toEqual(mockSuggestions);
    expect(mockedGetSearchSuggestions).toHaveBeenCalledWith('Ban');
  });

  it('returns 400 when query parameter is missing', async () => {
    const request = new Request('http://localhost:3000/api/search/suggestions');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Missing required query param "q"');
    expect(json.code).toBe('MISSING_QUERY');
    expect(json.param).toBe('q');
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
    expect(json.code).toBe('QUERY_TOO_LONG');
    expect(json.maxLength).toBe(256);
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
    expect(json.details).toBe('Specific error');
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
});

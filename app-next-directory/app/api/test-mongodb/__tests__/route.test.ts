import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { GET } from '../route';

// Mock mongodb client
const mockCommand = jest.fn();
const mockDb = jest.fn(() => ({ command: mockCommand }));
const mockClient = { db: mockDb };

jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: Promise.resolve(mockClient),
}));

describe('/api/test-mongodb', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCommand.mockResolvedValue({ ok: 1 });
  });

  it('returns success when MongoDB connection succeeds', async () => {
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.message).toBe('Successfully connected to MongoDB!');
    expect(mockCommand).toHaveBeenCalledWith({ ping: 1 });
  });

  it('handles MongoDB connection errors', async () => {
    mockCommand.mockRejectedValue(new Error('Connection failed'));
    
    process.env.NODE_ENV = 'development';
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Connection failed');
  });

  it('hides error details in production', async () => {
    mockCommand.mockRejectedValue(new Error('Connection failed'));
    
    process.env.NODE_ENV = 'production';
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Failed to connect to MongoDB');
  });
});

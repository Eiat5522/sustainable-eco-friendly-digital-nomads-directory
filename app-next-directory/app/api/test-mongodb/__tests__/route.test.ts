import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

import { GET, testControl } from '../route';

const mockCommand = jest.fn();
const mockDb = jest.fn(() => ({ command: mockCommand }));
const mockClient = { db: mockDb } as const;

const originalNodeEnv = process.env.NODE_ENV;

beforeEach(() => {
  mockCommand.mockReset();
  mockDb.mockReset().mockReturnValue({ command: mockCommand });
  testControl.clientOverride = Promise.resolve(mockClient as any);
  process.env.NODE_ENV = 'test';
});

afterEach(() => {
  testControl.clientOverride = undefined;
  process.env.NODE_ENV = originalNodeEnv;
});

describe('/api/test-mongodb', () => {
  it('returns success when MongoDB connection succeeds', async () => {
    mockCommand.mockResolvedValue({ ok: 1 });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.message).toBe('Successfully connected to MongoDB!');
    expect(mockCommand).toHaveBeenCalledWith({ ping: 1 });
  });

  it('handles MongoDB connection errors', async () => {
    mockCommand.mockRejectedValue(new Error('Connection failed'));

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Connection failed');
  });

  it('hides error details in production', async () => {
    process.env.NODE_ENV = 'production';
    mockCommand.mockRejectedValue(new Error('Connection failed'));

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Failed to connect to MongoDB');
  });
});

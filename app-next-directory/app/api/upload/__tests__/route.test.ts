import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

const mockedAuth = jest.fn();
const mockUpload = jest.fn();

jest.mock('@/lib/auth', () => ({ auth: (...args: unknown[]) => mockedAuth(...args) }));

// Mock fs/promises for readFile
jest.mock('fs/promises', () => ({
  readFile: jest.fn().mockResolvedValue(Buffer.from('optimized image data')),
}));

// Mock image-optimizer cleanup
jest.mock('@/lib/image-optimizer', () => ({
  optimizeFileBuffer: jest.fn(),
  cleanupOptimizedFile: jest.fn().mockResolvedValue(undefined),
}));

let POST: (req: NextRequest) => Promise<Response>;
let routeTestControl: {
  formDataOverride?: (() => Promise<FormData>) | jest.Mock;
  authOverride?: unknown;
  uploadOverride?: jest.Mock;
  optimizeOverride?: unknown;
  skipOptimization?: boolean;
};

const createMockFormData = (file?: File) =>
  ({
    get: (key: string) => (key === 'file' ? (file ?? null) : null),
  }) as unknown as FormData;

describe('/api/upload', () => {
  beforeEach(async () => {
    jest.resetModules();
    mockedAuth.mockReset();
    mockUpload.mockReset();
    // require after mocks

    ({ POST, _testControl: routeTestControl } = require('../route'));
    routeTestControl.formDataOverride = undefined;
    // set upload override to our mock
    routeTestControl.uploadOverride = mockUpload;
  });

  afterEach(() => {
    if (routeTestControl) {
      routeTestControl.authOverride = undefined;
      routeTestControl.uploadOverride = undefined;
      routeTestControl.formDataOverride = undefined;
      routeTestControl.optimizeOverride = undefined;
      routeTestControl.skipOptimization = false;
    }
  });

  it('returns 401 when user is not authenticated', async () => {
    mockedAuth.mockResolvedValue(null);

    routeTestControl.formDataOverride = async () => createMockFormData();
    expect(routeTestControl.formDataOverride).toBeDefined();

    const request = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('returns 401 when user is not a venue owner', async () => {
    mockedAuth.mockResolvedValue({
      user: { id: 'user-1', role: 'user' },
    } as { user: { id: string; role: string } });

    const formData = new FormData();
    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('returns 400 when file is missing', async () => {
    mockedAuth.mockResolvedValue({
      user: { id: 'user-1', role: 'venueOwner' },
    } as { user: { id: string; role: string } });
    const formDataOverride = jest.fn(async () => createMockFormData());
    routeTestControl.formDataOverride = formDataOverride;

    const request = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
    });

    const response = await POST(request);
    const text = await response.text();
    if (response.status !== 400) {
      throw new Error(`Unexpected status ${response.status} with body ${text}`);
    }
    expect(formDataOverride).toHaveBeenCalledTimes(1);
    expect(mockUpload).not.toHaveBeenCalled();
    expect(text).toContain('File is required');
  });

  it('uploads file successfully for venue owner', async () => {
    mockedAuth.mockResolvedValue({
      user: { id: 'user-1', role: 'venueOwner' },
    } as { user: { id: string; role: string } });

    const mockAsset = {
      _id: 'image-asset-1',
      url: 'https://cdn.sanity.io/images/test.jpg',
    };
    mockUpload.mockResolvedValue(mockAsset as { _id: string; url: string });

    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
    routeTestControl.formDataOverride = async () => createMockFormData(file);

    // Skip optimization for this test
    routeTestControl.skipOptimization = true;

    const request = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
    });

    const response = await POST(request);
    const json = await response.json();

    if (response.status !== 200) {
      console.error('Test failed with response:', json);
    }

    expect(response.status).toBe(200);
    expect(json.asset).toEqual(mockAsset);
    expect(json.optimization).toBeDefined();
    expect(mockUpload).toHaveBeenCalledWith('image', expect.any(File));
  });

  it('handles upload errors', async () => {
    mockedAuth.mockResolvedValue({
      user: { id: 'user-1', role: 'venueOwner' },
    } as { user: { id: string; role: string } });

    mockUpload.mockRejectedValue(new Error('Upload failed'));

    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
    routeTestControl.formDataOverride = async () => createMockFormData(file);

    // Skip optimization for this test
    routeTestControl.skipOptimization = true;

    const request = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Failed to upload image');
  });

  it('uses optimized image when optimization succeeds', async () => {
    mockedAuth.mockResolvedValue({
      user: { id: 'user-1', role: 'venueOwner' },
    } as { user: { id: string; role: string } });

    const mockAsset = {
      _id: 'image-asset-2',
      url: 'https://cdn.sanity.io/images/test-optimized.webp',
    };
    mockUpload.mockResolvedValue(mockAsset as { _id: string; url: string });

    // Create a file with arrayBuffer method
    const fileContent = Buffer.from('test content');
    const file = new File([fileContent], 'test.jpg', { type: 'image/jpeg' });

    // Add arrayBuffer method to File prototype for this test
    Object.defineProperty(file, 'arrayBuffer', {
      value: jest.fn().mockResolvedValue(fileContent.buffer),
    });

    routeTestControl.formDataOverride = async () => createMockFormData(file);

    // Mock successful optimization
    routeTestControl.optimizeOverride = jest.fn().mockResolvedValue({
      success: true,
      optimizedPath: '/tmp/test-optimized.webp',
      originalSize: 10000,
      optimizedSize: 5000,
    });

    const request = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.asset).toEqual(mockAsset);
    expect(json.optimization.applied).toBe(true);
    expect(json.optimization.originalSize).toBe(10000);
    expect(json.optimization.optimizedSize).toBe(5000);
  });
});

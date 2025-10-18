import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';

const mockedAuth = jest.fn();
const mockUpload = jest.fn();

jest.mock('@/lib/auth', () => ({ auth: (...args: any[]) => mockedAuth(...args) }));

let POST: any;
let routeTestControl: any;

const createMockFormData = (file?: File) =>
  ({
    get: (key: string) => (key === 'file' ? file ?? null : null),
  } as unknown as FormData);

describe('/api/upload', () => {
  beforeEach(async () => {
    jest.resetModules();
    mockedAuth.mockReset();
    mockUpload.mockReset();
  // require after mocks
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ({ POST, testControl: routeTestControl } = require('../route'));
  routeTestControl.formDataOverride = undefined;
  // set upload override to our mock
  routeTestControl.uploadOverride = mockUpload;
  });

  afterEach(() => {
    if (routeTestControl) {
      routeTestControl.authOverride = undefined;
      routeTestControl.uploadOverride = undefined;
      routeTestControl.formDataOverride = undefined;
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
    } as any);
    
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
    } as any);
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
    } as any);
    
    const mockAsset = {
      _id: 'image-asset-1',
      url: 'https://cdn.sanity.io/images/test.jpg',
    };
    mockUpload.mockResolvedValue(mockAsset as any);
    
    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
  routeTestControl.formDataOverride = async () => createMockFormData(file);

    const request = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
    });
    
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.asset).toEqual(mockAsset);
    expect(mockUpload).toHaveBeenCalledWith('image', file);
  });

  it('handles upload errors', async () => {
    mockedAuth.mockResolvedValue({
      user: { id: 'user-1', role: 'venueOwner' },
    } as any);
    
    mockUpload.mockRejectedValue(new Error('Upload failed'));
    
    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
  routeTestControl.formDataOverride = async () => createMockFormData(file);

    const request = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
    });
    
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Failed to upload image');
  });
});

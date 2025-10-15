import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { client } from '@/lib/sanity';
import { auth } from '@/lib/auth';

jest.mock('@/lib/sanity', () => ({
  client: {
    assets: {
      upload: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

describe('/api/upload', () => {
  let mockedAuth: jest.Mock;
  let mockedUpload: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAuth = auth as jest.Mock;
    mockedUpload = client.assets.upload as jest.Mock;
  });

  it('returns 401 when user is not authenticated', async () => {
    mockedAuth.mockResolvedValue(null);
    
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
    
    const formData = new FormData();
    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('File is required');
  });

  it('uploads file successfully for venue owner', async () => {
    mockedAuth.mockResolvedValue({
      user: { id: 'user-1', role: 'venueOwner' },
    } as any);
    
    const mockAsset = {
      _id: 'image-asset-1',
      url: 'https://cdn.sanity.io/images/test.jpg',
    };
    mockedUpload.mockResolvedValue(mockAsset as any);
    
    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', file);
    
    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.asset).toEqual(mockAsset);
    expect(mockedUpload).toHaveBeenCalledWith('image', file);
  });

  it('handles upload errors', async () => {
    mockedAuth.mockResolvedValue({
      user: { id: 'user-1', role: 'venueOwner' },
    } as any);
    
    mockedUpload.mockRejectedValue(new Error('Upload failed'));
    
    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', file);
    
    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Failed to upload image');
  });
});

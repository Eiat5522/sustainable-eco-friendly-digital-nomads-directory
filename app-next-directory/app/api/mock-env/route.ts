import { NextRequest } from 'next/server';
import { ApiResponseHandler } from '@/utils/api-response';

type NodeEnv = 'development' | 'production' | 'test';

// Mock environment state
let mockNodeEnv: NodeEnv = (process.env.NODE_ENV as NodeEnv) || 'development';
let mockPreviewSecret = process.env.PREVIEW_SECRET || '';

export async function GET(request: NextRequest) {
  // Get environment values from headers
  const nodeEnv = request.headers.get('x-test-node-env');
  const previewSecret = request.headers.get('x-test-preview-secret');

  // Update mock environment values if provided
  if (nodeEnv && (nodeEnv === 'development' || nodeEnv === 'production' || nodeEnv === 'test')) {
    mockNodeEnv = nodeEnv;
  }
  if (previewSecret) {
    mockPreviewSecret = previewSecret;
  }

  // Mock the environment for preview routes
  Object.defineProperty(process.env, 'NODE_ENV', {
    get: () => mockNodeEnv,
    configurable: true
  });

  Object.defineProperty(process.env, 'PREVIEW_SECRET', {
    get: () => mockPreviewSecret,
    configurable: true
  });

  const res = ApiResponseHandler.success({
    NODE_ENV: mockNodeEnv,
    // Never expose secrets over the wire
    previewSecret: '***',  });
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  return res;
}

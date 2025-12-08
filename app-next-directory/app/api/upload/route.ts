import fs from 'node:fs/promises';
import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { auth } from '@/lib/auth';
import {
  cleanupOptimizedFile,
  type OptimizationOptions,
  type OptimizationResult,
  optimizeFileBuffer,
} from '@/lib/image-optimizer';
import { structuredLogger } from '@/lib/logger';
import { client } from '@/lib/sanity';

type AuthFn = () => Promise<Session | null>;
type UploadFn = (assetType: 'image' | 'file', uploadFile: File) => Promise<unknown>;
type FormDataFn = (request: Request) => Promise<FormData>;
type OptimizeFn = (
  buffer: Buffer,
  fileName: string,
  options: OptimizationOptions
) => Promise<OptimizationResult>;

const isTestEnv = process.env.NODE_ENV === 'test';
const enableDevTestHook = process.env.ENABLE_UPLOAD_TEST_HOOK === '1';

type UploadTestControl = {
  authOverride?: AuthFn;
  uploadOverride?: UploadFn;
  formDataOverride?: FormDataFn;
  optimizeOverride?: OptimizeFn;
  skipOptimization?: boolean;
};

const _testControl: UploadTestControl | undefined =
  isTestEnv || enableDevTestHook
    ? {
        authOverride: enableDevTestHook
          ? async () => ({ user: { id: 'dev-user', role: 'venueOwner' } }) as unknown as Session
          : undefined,
        uploadOverride: enableDevTestHook
          ? async (_assetType: 'image' | 'file', _uploadFile: File) => ({
              _id: 'dev-asset',
              url: '/_assets/dev.png',
            })
          : undefined,
        formDataOverride: undefined,
        optimizeOverride: undefined,
        skipOptimization: false,
      }
    : undefined;

// Expose test control for tests and for local dev when explicitly enabled.
if (isTestEnv || enableDevTestHook) {
  (module.exports as Record<string, unknown>)._testControl = _testControl;
}

export async function POST(request: Request) {
  const authFn = _testControl?.authOverride ?? auth;
  
  // FORTEST: guard for prerender - handle headers() unavailability
  let session: Awaited<ReturnType<typeof authFn>> | null = null;
  try {
    session = await authFn();
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('headers()') || msg.includes('During prerendering')) {
      structuredLogger.warn('[upload] headers() unavailable during prerender', error, {
        route: '/api/upload',
      });
      return new Response(null, { status: 204 });
    }
    throw error;
  }
  
  // session.user can be a loose object in tests; cast to unknown to avoid typing issues
  const sessionUser = (session as { user?: { id?: string; role?: string } })?.user;

  if (sessionUser?.role !== 'venueOwner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formDataGetter = _testControl?.formDataOverride ?? ((req: Request) => req.formData());
    const formData = await formDataGetter(request);
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    let fileToUpload: File = file;
    let optimizedPath: string | undefined;
    let optimizationResult: OptimizationResult = {
      success: false,
      error: 'Optimization skipped',
      originalSize: 0,
      optimizedSize: 0,
    };

    // Perform optimization unless explicitly skipped in tests
    if (!_testControl?.skipOptimization) {
      try {
        // Convert File to Buffer for optimization
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        optimizationResult.originalSize = fileBuffer.length;

        // Optimize image before upload (Task 9 integration)
        const optimizeFn = _testControl?.optimizeOverride ?? optimizeFileBuffer;
        optimizationResult = await optimizeFn(fileBuffer, file.name, {
          maxWidth: 1600,
          maxHeight: 1200,
          quality: 85,
          format: 'webp',
        });

        // If optimization succeeded, use optimized file
        if (optimizationResult.success && optimizationResult.optimizedPath) {
          optimizedPath = optimizationResult.optimizedPath;
          const optimizedBuffer = await fs.readFile(optimizationResult.optimizedPath);
          const optimizedFileName = file.name.replace(/\.\w+$/, '.webp');
          fileToUpload = new File([optimizedBuffer], optimizedFileName, {
            type: 'image/webp',
          });
        } else {
        }
      } catch (_error) {
        structuredLogger.error('Optimization failed', _error, {
          component: 'upload-api',
          fileName: file.name,
        });
        optimizationResult.error = _error instanceof Error ? _error.message : 'Unknown error';
      }
    }

    const uploadFn =
      _testControl?.uploadOverride ??
      ((assetType: 'image' | 'file', uploadFile: File) =>
        client.assets.upload(assetType, uploadFile));
    const imageAsset = await uploadFn('image', fileToUpload);

    // Cleanup optimized file
    if (optimizedPath) {
      await cleanupOptimizedFile(optimizedPath);
    }

    return NextResponse.json({
      asset: imageAsset,
      optimization: {
        applied: optimizationResult.success,
        originalSize: optimizationResult.originalSize,
        optimizedSize: optimizationResult.optimizedSize,
      },
    });
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}

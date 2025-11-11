
import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { client } from '@/lib/sanity';
import { auth } from '@/lib/auth';
import {
  optimizeFileBuffer,
  cleanupOptimizedFile,
  type OptimizationOptions,
  type OptimizationResult,
} from '@/lib/image-optimizer';
import fs from 'fs/promises';
import logger from '@/lib/logger';

type AuthFn = () => Promise<Session | null>;
type UploadFn = (assetType: 'image' | 'file', uploadFile: File) => Promise<unknown>;
type FormDataFn = (request: Request) => Promise<FormData>;
type OptimizeFn = (buffer: Buffer, fileName: string, options: OptimizationOptions) => Promise<OptimizationResult>;

const isTestEnv = process.env.NODE_ENV === 'test';

export const _testControl = isTestEnv
  ? {
      authOverride: undefined as AuthFn | undefined,
      uploadOverride: undefined as UploadFn | undefined,
      formDataOverride: undefined as FormDataFn | undefined,
      optimizeOverride: undefined as OptimizeFn | undefined,
      skipOptimization: false,
    }
  : undefined;

export async function POST(request: Request) {
  const authFn = _testControl?.authOverride ?? auth;
  const session = await authFn();
  // session.user can be a loose object in tests; cast to unknown to avoid typing issues
  const sessionUser = (session as { user?: { id?: string; role?: string } })?.user;

  if (sessionUser?.role !== 'venueOwner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formDataGetter =
      _testControl?.formDataOverride ?? ((req: Request) => req.formData());
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
      optimizedSize: 0
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
          format: 'webp'
        });

        // If optimization succeeded, use optimized file
        if (optimizationResult.success && optimizationResult.optimizedPath) {
          optimizedPath = optimizationResult.optimizedPath;
          const optimizedBuffer = await fs.readFile(optimizationResult.optimizedPath);
          const optimizedFileName = file.name.replace(/\.\w+$/, '.webp');
          fileToUpload = new File([optimizedBuffer], optimizedFileName, {
            type: 'image/webp'
          });
          console.log(`✅ Using optimized image: ${file.name} → ${optimizedFileName}`);
        } else {
          console.warn(`⚠️  Optimization skipped, using original file: ${optimizationResult.error || 'Unknown reason'}`);
        }
      } catch (_error) {
        logger.error('Optimization failed', _error, { component: 'upload-api', fileName: file.name });
        optimizationResult.error = _error instanceof Error ? _error.message : 'Unknown error';
      }
    }

    const uploadFn =
      _testControl?.uploadOverride ??
      ((assetType: 'image' | 'file', uploadFile: File) => client.assets.upload(assetType, uploadFile));
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
        optimizedSize: optimizationResult.optimizedSize
      }
    });
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}

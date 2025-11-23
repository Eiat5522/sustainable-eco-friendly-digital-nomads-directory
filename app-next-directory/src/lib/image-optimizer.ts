/**
 * Image Optimization Module
 *
 * Historically this project invoked a Python pipeline to pre-process uploads
 * before handing them to Sanity. That flow has been retired in favour of the
 * built-in optimisations provided by Sanity's CDN and Next.js `next/image`.
 *
 * The helpers in this module are retained so the upload API keeps the same
 * contract, but they now operate as lightweight pass-through utilities. This
 * allows existing consumers and tests to remain unchanged while avoiding the
 * Python dependency entirely.
 */

export interface OptimizationResult {
  success: boolean;
  optimizedPath?: string;
  originalSize?: number;
  optimizedSize?: number;
  error?: string;
}

export interface OptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

const LEGACY_OPTIMIZER_MESSAGE =
  'Python-based optimisation has been removed; rely on Sanity CDN + next/image.';

/**
 * Previously invoked the Python optimiser for files on disk. Now it simply
 * returns a skip marker so the calling code can continue without attempting
 * to use an optimised asset. No file system operations are performed.
 */
export async function optimizeImageFile(
  _inputPath: string,
  _options: OptimizationOptions = {}
): Promise<OptimizationResult> {
  return {
    success: false,
    error: LEGACY_OPTIMIZER_MESSAGE,
  };
}

/**
 * Legacy entry point for buffer-based optimisation. With the Python pipeline
 * removed we now surface the buffer size for observability while signalling
 * that no transformation was performed.
 */
export async function optimizeFileBuffer(
  fileBuffer: Buffer,
  _fileName: string,
  _options: OptimizationOptions = {}
): Promise<OptimizationResult> {
  return {
    success: false,
    originalSize: fileBuffer.length,
    optimizedSize: fileBuffer.length,
    error: LEGACY_OPTIMIZER_MESSAGE,
  };
}

/**
 * No temporary artefacts are produced anymore, so cleanup becomes a no-op.
 * The function remains async to keep API compatibility with previous callers.
 */
export async function cleanupOptimizedFile(_filePath: string): Promise<void> {
  return Promise.resolve();
}

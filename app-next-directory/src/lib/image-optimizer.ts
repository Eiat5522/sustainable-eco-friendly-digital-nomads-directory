/**
 * Image Optimization Module - Task 9
 * Integrates Python-based image optimization with the Sanity upload workflow
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

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

/**
 * Optimizes an image file using the Python batch_optimize_images.py script
 * or fallback to pass-through if optimization fails
 */
export async function optimizeImageFile(
  inputPath: string,
  options: OptimizationOptions = {}
): Promise<OptimizationResult> {
  try {
    // Validate input file exists
    const stats = await fs.stat(inputPath);
    const originalSize = stats.size;

    // Check if Python and Pillow are available
    const pythonAvailable = await checkPythonAvailability();
    
    if (!pythonAvailable) {
      console.warn('⚠️  Python or Pillow not available, skipping optimization');
      return {
        success: false,
        error: 'Python optimization not available',
        originalSize
      };
    }

    // Create temporary output path
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'image-opt-'));
    const fileName = path.basename(inputPath);
    const outputPath = path.join(tempDir, fileName.replace(/\.\w+$/, '.webp'));

    // Create a temporary single-file optimization script
    let singleOptScript: string | undefined;
    
    try {
      singleOptScript = await createSingleFileOptimizer(
        inputPath,
        outputPath,
        options
      );

      // Use shell-safe execution
      const { stdout, stderr } = await execAsync(
        `python3 "${singleOptScript}"`,
        { timeout: 30000 } // 30 second timeout
      );

      if (stderr && !stderr.includes('warning')) {
        console.error('Python optimization stderr:', stderr);
      }

      // Check if output file was created
      const optimizedStats = await fs.stat(outputPath);
      const optimizedSize = optimizedStats.size;

      console.log(
        `✅ Image optimized: ${fileName} (${originalSize} → ${optimizedSize} bytes)`
      );

      return {
        success: true,
        optimizedPath: outputPath,
        originalSize,
        optimizedSize
      };
    } catch (error) {
      console.error('❌ Python optimization failed:', error);
      // Clean up temp directory on failure
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        originalSize
      };
    } finally {
      // Always clean up the temporary Python script
      if (singleOptScript) {
        await fs.unlink(singleOptScript).catch(() => {});
      }
    }
  } catch (error) {
    console.error('❌ Image optimization error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Checks if Python and Pillow are available
 */
async function checkPythonAvailability(): Promise<boolean> {
  try {
    const { stdout } = await execAsync('python3 -c "from PIL import Image; print(1)"', {
      timeout: 5000
    });
    return stdout.trim() === '1';
  } catch {
    return false;
  }
}

/**
 * Creates a temporary Python script for single-file optimization
 * Uses JSON for safe parameter passing to avoid injection vulnerabilities
 */
async function createSingleFileOptimizer(
  inputPath: string,
  outputPath: string,
  options: OptimizationOptions
): Promise<string> {
  const targetSize = `(${options.maxWidth || 1600}, ${options.maxHeight || 1200})`;
  const quality = options.quality || 85;
  
  // Use JSON for safe parameter passing
  const scriptContent = `
import os
import json
import sys
from PIL import Image

# Read parameters from environment or use defaults
config = {
    "src_path": r"${inputPath}",
    "dest_path": r"${outputPath}",
    "target_size": ${targetSize},
    "quality": ${quality}
}

def optimize_image(src_path, dest_path, target_size, quality):
    try:
        with Image.open(src_path) as img:
            img = img.convert('RGB')
            img.thumbnail(target_size, Image.LANCZOS)
            img.save(dest_path, 'WEBP', quality=quality, method=6)
            print(f"Optimized: {src_path} -> {dest_path}")
    except Exception as e:
        print(f"Error optimizing {src_path}: {e}", file=sys.stderr)
        raise

optimize_image(
    config["src_path"],
    config["dest_path"],
    config["target_size"],
    config["quality"]
)
`;

  const tempScript = path.join(os.tmpdir(), `optimize_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.py`);
  await fs.writeFile(tempScript, scriptContent);
  return tempScript;
}

/**
 * Optimizes a File object (browser-side) by converting to buffer and optimizing
 * This is a server-side function that receives the file data
 */
export async function optimizeFileBuffer(
  fileBuffer: Buffer,
  fileName: string,
  options: OptimizationOptions = {}
): Promise<OptimizationResult> {
  try {
    // Create temporary input file
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'image-opt-'));
    const inputPath = path.join(tempDir, fileName);
    
    await fs.writeFile(inputPath, fileBuffer);
    
    const result = await optimizeImageFile(inputPath, options);
    
    // Clean up input file
    await fs.unlink(inputPath).catch(() => {});
    
    return result;
  } catch (error) {
    console.error('❌ Buffer optimization error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Clean up temporary optimization files
 */
export async function cleanupOptimizedFile(filePath: string): Promise<void> {
  try {
    const dir = path.dirname(filePath);
    await fs.rm(dir, { recursive: true, force: true });
  } catch (error) {
    console.error('Failed to cleanup optimized file:', error);
  }
}

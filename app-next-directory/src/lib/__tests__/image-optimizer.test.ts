/**
 * Tests for the simplified Image Optimizer module.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { mkdtemp, writeFile, rm } from 'fs/promises';
import os from 'os';
import path from 'path';

import { optimizeImageFile, optimizeFileBuffer, cleanupOptimizedFile } from '../image-optimizer';

describe('image-optimizer', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'image-optimizer-test-'));
  });

  describe('optimizeImageFile', () => {
    it('returns a pass-through result when the file is missing', async () => {
      const result = await optimizeImageFile(path.join(tempDir, 'missing.jpg'));

      expect(result.success).toBe(false);
      expect(result.originalSize).toBeUndefined();
      expect(result.optimizedSize).toBeUndefined();
      expect(result.error).toContain('Sanity CDN');
    });

    it('reports the original file size when available', async () => {
      const filePath = path.join(tempDir, 'example.jpg');
      const buffer = Buffer.from('mock image data');
      await writeFile(filePath, buffer);

      const result = await optimizeImageFile(filePath);

      expect(result.success).toBe(false);
      expect(result.originalSize).toBe(buffer.length);
      expect(result.optimizedSize).toBe(buffer.length);
      expect(result.error).toContain('Sanity CDN');
    });
  });

  describe('optimizeFileBuffer', () => {
    it('returns a pass-through result with buffer sizing', async () => {
      const buffer = Buffer.from('mock image data');

      const result = await optimizeFileBuffer(buffer, 'file.jpg');

      expect(result.success).toBe(false);
      expect(result.originalSize).toBe(buffer.length);
      expect(result.optimizedSize).toBe(buffer.length);
      expect(result.error).toContain('Sanity CDN');
    });
  });

  describe('cleanupOptimizedFile', () => {
    it('resolves without throwing', async () => {
      await expect(cleanupOptimizedFile('/tmp/file.webp')).resolves.toBeUndefined();
    });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });
});

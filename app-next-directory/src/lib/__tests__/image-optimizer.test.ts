/**
 * Tests for Image Optimizer Module - Task 9
 */

// Mock modules before importing the module under test
jest.mock('child_process');
jest.mock('fs/promises');
jest.mock('os');
jest.mock('util', () => ({
  ...jest.requireActual('util'),
  promisify: (fn: any) => (...args: any[]) => {
    return new Promise((resolve, reject) => {
      fn(...args, (error: any, stdout: any, stderr: any) => {
        if (error) reject(error);
        else resolve({ stdout, stderr });
      });
    });
  },
}));

import {
  optimizeImageFile,
  optimizeFileBuffer,
  cleanupOptimizedFile,
} from '../image-optimizer';
import { exec } from 'child_process';
import fs from 'fs/promises';
import os from 'os';

const mockExec = exec as jest.MockedFunction<typeof exec>;
const mockFs = fs as jest.Mocked<typeof fs>;
const mockOs = os as jest.Mocked<typeof os>;

describe('image-optimizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockOs.tmpdir as jest.Mock).mockReturnValue('/tmp');
  });

  describe('optimizeImageFile', () => {
    it('should return error when input file does not exist', async () => {
      mockFs.stat.mockRejectedValue(new Error('File not found'));

      const result = await optimizeImageFile('/nonexistent/file.jpg');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error when Python is not available', async () => {
      mockFs.stat.mockResolvedValue({ size: 1000 } as any);
      mockExec.mockImplementation((_cmd: any, _options: any, callback: any) => {
        callback(new Error('Python not found'), '', '');
        return {} as any;
      });

      const result = await optimizeImageFile('/test/image.jpg');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should successfully optimize image when Python is available', async () => {
      const inputSize = 10000;
      const outputSize = 5000;
      
      mockFs.stat
        .mockResolvedValueOnce({ size: inputSize } as any)
        .mockResolvedValueOnce({ size: outputSize } as any);
      
      mockFs.mkdtemp.mockResolvedValue('/tmp/image-opt-123');
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.unlink.mockResolvedValue(undefined);
      mockFs.rm.mockResolvedValue(undefined);

      let execCallCount = 0;
      mockExec.mockImplementation((_cmd: any, _options: any, callback: any) => {
        execCallCount++;
        
        // First call is Python availability check
        if (execCallCount === 1) {
          callback(null, '1\n', '');
        } 
        // Second call is actual optimization
        else {
          callback(null, 'Optimized: /test/image.jpg -> /tmp/image-opt-123/image.webp', '');
        }
        return {} as any;
      });

      const result = await optimizeImageFile('/test/image.jpg');

      expect(result.success).toBe(true);
      expect(result.originalSize).toBe(inputSize);
      expect(result.optimizedSize).toBe(outputSize);
      expect(result.optimizedPath).toContain('.webp');
    });

    it('should handle optimization failures gracefully', async () => {
      mockFs.stat.mockResolvedValue({ size: 1000 } as any);
      mockFs.mkdtemp.mockResolvedValue('/tmp/image-opt-123');
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.rm.mockResolvedValue(undefined);

      let execCallCount = 0;
      mockExec.mockImplementation((_cmd: any, _options: any, callback: any) => {
        execCallCount++;
        
        if (execCallCount === 1) {
          callback(null, '1\n', '');
        } else {
          callback(new Error('Optimization failed'), '', 'Error');
        }
        return {} as any;
      });

      const result = await optimizeImageFile('/test/image.jpg');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(mockFs.rm).toHaveBeenCalled();
    });
  });

  describe('optimizeFileBuffer', () => {
    it('should create temp file, optimize, and cleanup', async () => {
      const buffer = Buffer.from('fake image data');
      const fileName = 'test.jpg';

      mockFs.mkdtemp.mockResolvedValue('/tmp/image-opt-456');
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.unlink.mockResolvedValue(undefined);
      mockFs.stat
        .mockResolvedValueOnce({ size: buffer.length } as any)
        .mockResolvedValueOnce({ size: 500 } as any);

      let execCallCount = 0;
      mockExec.mockImplementation((_cmd: any, _options: any, callback: any) => {
        execCallCount++;
        
        if (execCallCount === 1) {
          callback(null, '1\n', '');
        } else {
          callback(null, 'Optimized', '');
        }
        return {} as any;
      });

      const result = await optimizeFileBuffer(buffer, fileName);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('test.jpg'),
        buffer
      );
      expect(mockFs.unlink).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should handle buffer optimization errors', async () => {
      const buffer = Buffer.from('fake image data');
      
      mockFs.mkdtemp.mockRejectedValue(new Error('Temp dir error'));

      const result = await optimizeFileBuffer(buffer, 'test.jpg');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('cleanupOptimizedFile', () => {
    it('should remove temporary directory', async () => {
      mockFs.rm.mockResolvedValue(undefined);

      await cleanupOptimizedFile('/tmp/image-opt-123/image.webp');

      expect(mockFs.rm).toHaveBeenCalledWith(
        '/tmp/image-opt-123',
        { recursive: true, force: true }
      );
    });

    it('should not throw on cleanup errors', async () => {
      mockFs.rm.mockRejectedValue(new Error('Cleanup error'));

      await expect(
        cleanupOptimizedFile('/tmp/image-opt-123/image.webp')
      ).resolves.not.toThrow();
    });
  });
});

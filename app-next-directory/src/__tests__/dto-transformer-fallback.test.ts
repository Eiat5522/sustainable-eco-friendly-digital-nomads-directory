/**
 * @file dto-transformer-fallback.test.ts
 * @description Integration tests for the fallback image system in DTO transformers
 */

import { imageOrFallback, FALLBACK_IMAGE } from '@/lib/dto-transformer';

describe('DTO Transformer Fallback Image System', () => {
  test('should use fallback image for null input', () => {
    const result = imageOrFallback(null, 300, 200);
    expect(result).toBe(FALLBACK_IMAGE);
  });

  test('should use fallback image for undefined input', () => {
    const result = imageOrFallback(undefined, 300, 200);
    expect(result).toBe(FALLBACK_IMAGE);
  });

  test('should use fallback image for empty string', () => {
    const result = imageOrFallback('', 300, 200);
    expect(result).toBe(FALLBACK_IMAGE);
  });

  test('should use fallback image for invalid image object', () => {
    const result = imageOrFallback({ invalid: 'object' }, 300, 200);
    expect(result).toBe(FALLBACK_IMAGE);
  });

  test('should process valid URLs correctly', () => {
    const testUrl = 'https://example.com/image.jpg';
    const result = imageOrFallback(testUrl, 300, 200);
    expect(result).toContain('example.com/image.jpg');
    expect(result).toContain('w=300');
    expect(result).toContain('h=200');
  });

  test('should use fallback for invalid URL strings', () => {
    const result = imageOrFallback('not-a-valid-asset-ref', 300, 200);
    expect(result).toBe(FALLBACK_IMAGE);
  });

  test('FALLBACK_IMAGE should be a valid path', () => {
    expect(FALLBACK_IMAGE).toBe('/placeholder_image.png');
    expect(FALLBACK_IMAGE.startsWith('/')).toBe(true);
    expect(FALLBACK_IMAGE.endsWith('.png')).toBe(true);
  });
});
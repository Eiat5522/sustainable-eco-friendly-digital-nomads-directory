/**
 * @file placeholder-image.test.ts
 * @description Tests to ensure the placeholder image is present and accessible.
 * This is a critical test to prevent accidental removal of the fallback image.
 */

import { FALLBACK_IMAGE } from '@/lib/dto-transformer';
import fs from 'fs';
import path from 'path';

describe('Placeholder Image Protection', () => {
  const publicDir = path.join(process.cwd(), 'public');
  const placeholderPath = path.join(publicDir, 'placeholder_image.png');

  test('FALLBACK_IMAGE constant should be defined', () => {
    expect(FALLBACK_IMAGE).toBeDefined();
    expect(typeof FALLBACK_IMAGE).toBe('string');
    expect(FALLBACK_IMAGE).toBe('/placeholder_image.png');
  });

  test('placeholder_image.png file must exist in public directory', () => {
    expect(fs.existsSync(placeholderPath)).toBe(true);
  });

  test('placeholder_image.png file should be readable', () => {
    const stats = fs.statSync(placeholderPath);
    expect(stats.isFile()).toBe(true);
    expect(stats.size).toBeGreaterThan(0);
  });

  test('placeholder_image.png should be a valid PNG file', () => {
    const buffer = fs.readFileSync(placeholderPath);
    // PNG files start with the signature: 89 50 4E 47 0D 0A 1A 0A
    const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    
    expect(buffer.length).toBeGreaterThan(8);
    for (let i = 0; i < pngSignature.length; i++) {
      expect(buffer[i]).toBe(pngSignature[i]);
    }
  });

  test('placeholder_image.png should have reasonable file size (not empty, not too large)', () => {
    const stats = fs.statSync(placeholderPath);
    expect(stats.size).toBeGreaterThan(1000); // At least 1KB
    expect(stats.size).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
  });
});
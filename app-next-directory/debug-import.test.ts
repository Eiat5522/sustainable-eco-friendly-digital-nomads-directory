// This test file will help us understand how the imports are being resolved
import mongoose, { Schema } from 'mongoose';
import { structuredLogger } from '@/lib/logger';

describe('Import Debug', () => {
  it('should have Schema as a constructor', () => {
    structuredLogger.debug('mongoose:', mongoose);
    structuredLogger.debug('Schema:', Schema);
    structuredLogger.debug('typeof Schema:', typeof Schema);
    structuredLogger.debug('mongoose.Schema:', mongoose.Schema);
    expect(typeof Schema).toBe('function');
  });
});

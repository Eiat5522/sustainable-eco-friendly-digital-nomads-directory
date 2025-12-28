// This test file will help us understand how the imports are being resolved
import mongoose, { Schema } from 'mongoose';

describe('Import Debug', () => {
  it('should have Schema as a constructor', () => {
    console.log('mongoose:', mongoose);
    console.log('Schema:', Schema);
    console.log('typeof Schema:', typeof Schema);
    console.log('mongoose.Schema:', mongoose.Schema);
    expect(typeof Schema).toBe('function');
  });
});

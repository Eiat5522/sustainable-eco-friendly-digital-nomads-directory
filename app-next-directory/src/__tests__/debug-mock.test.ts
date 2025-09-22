import { jest } from '@jest/globals';

// Test with the @ alias path that should be resolved by moduleNameMapper
jest.mock('@/lib/dbConnect', () => {
  return jest.fn().mockResolvedValue(undefined);
});

import dbConnect from '@/lib/dbConnect';

describe('Debug Mock Test', () => {
  test('should show what dbConnect is', () => {
    console.log('dbConnect:', dbConnect);
    console.log('typeof dbConnect:', typeof dbConnect);
    console.log('jest.isMockFunction(dbConnect):', jest.isMockFunction(dbConnect));
    
    if (jest.isMockFunction(dbConnect)) {
      console.log('dbConnect.mockResolvedValue:', dbConnect.mockResolvedValue);
      // Try to call mockResolvedValue
      try {
        dbConnect.mockResolvedValue('test');
        console.log('✅ mockResolvedValue works!');
      } catch (e) {
        console.log('❌ mockResolvedValue failed:', e);
      }
    } else {
      console.log('❌ dbConnect is not a mock function');
    }
  });
});
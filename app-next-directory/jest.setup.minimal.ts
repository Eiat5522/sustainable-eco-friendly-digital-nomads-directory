// Minimal jest setup for leak detection testing
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

// Add automatic cleanup after each test
afterEach(async () => {
  cleanup();
  
  // Run garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  // Flush pending promises
  await new Promise(resolve => setTimeout(resolve, 0));
});

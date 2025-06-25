import '@testing-library/jest-dom';

// Mock NextResponse.json for Jest (Node.js environment)
try {
  // Dynamically import to avoid breaking in non-Next.js contexts
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { NextResponse } = require('next/server');
  if (typeof NextResponse.json !== 'function') {
    NextResponse.json = (data: any, init?: any) => {
      return {
        status: (init && init.status) || 200,
        json: async () => data,
        headers: {
          get: () => null,
        },
      };
    };
  }
} catch (e) {
  // Ignore if next/server is not available
}
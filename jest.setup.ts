import '@testing-library/jest-dom';

// Mock NextResponse.json for Jest (Node.js environment)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { NextResponse } = require('next/server');

NextResponse.json = (data: any, init?: any) => ({
  status: init?.status ?? 200,
  json: async () => data,
  headers: { get: () => null },
});
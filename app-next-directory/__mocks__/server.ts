import { setupServer } from 'msw/node';
import type { RequestHandler } from 'msw';

// Define handlers array - can be populated as needed
export const handlers: RequestHandler[] = [];

// Setup MSW server for Node environment (Jest tests)
export const server = setupServer(...handlers);

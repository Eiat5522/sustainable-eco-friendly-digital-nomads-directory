import { setupServer } from 'msw/node'

// Define handlers array - can be populated as needed
export const handlers: any[] = []

// Setup MSW server for Node environment (Jest tests)
export const server = setupServer(...handlers)

export const createClient = jest.fn(() => ({
  fetch: jest.fn(() => Promise.resolve([])),
  // Add other methods that your application uses from the client, if necessary
  // For example, if you use .create, .update, .delete, .listen, etc.
  create: jest.fn(() => Promise.resolve({ _id: 'mock-id' })),
  update: jest.fn(() => Promise.resolve({})),
  delete: jest.fn(() => Promise.resolve('')),
  getDocument: jest.fn(() => Promise.resolve({ _id: 'mock-id' })),
}));

// Mock imageUrlBuilder if used
export const imageUrlBuilder = jest.fn(() => ({
  image: jest.fn(() => ({
    url: jest.fn(() => 'mock-image-url'),
  })),
}));

const mockClient = {
  fetch: jest.fn(() => Promise.resolve([])),
  create: jest.fn(() => Promise.resolve({ _id: 'mock-id' })),
  update: jest.fn(() => Promise.resolve({})),
  delete: jest.fn(() => Promise.resolve('')),
  getDocument: jest.fn(() => Promise.resolve({ _id: 'mock-id' })),
};

export default mockClient;

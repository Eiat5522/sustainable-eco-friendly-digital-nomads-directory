import { urlFor } from './image';
import { builder } from './client';

// Mock the builder object
jest.mock('./client', () => ({
  builder: {
    image: jest.fn((source) => ({
      // Mock a chainable image builder
      width: jest.fn().mockReturnThis(),
      height: jest.fn().mockReturnThis(),
      fit: jest.fn().mockReturnThis(),
      auto: jest.fn().mockReturnThis(),
      url: jest.fn(() => `mock-image-url-${source.asset._ref}`),
    })),
  },
}));

describe('urlFor', () => {
  beforeEach(() => {
    // Clear mock calls before each test
    jest.clearAllMocks();
  });

  test('should return a URL for a valid image source', () => {
    const mockSource = { asset: { _ref: 'image-asset-id' } };
    const imageUrl = urlFor(mockSource);

    expect(builder.image).toHaveBeenCalledWith(mockSource);
    expect(imageUrl?.url()).toBe('mock-image-url-image-asset-id');
  });

  test('should return undefined for a null source', () => {
    const imageUrl = urlFor(null);
    expect(imageUrl).toBeUndefined();
    expect(builder.image).not.toHaveBeenCalled();
  });

  test('should return undefined for an undefined source', () => {
    const imageUrl = urlFor(undefined);
    expect(imageUrl).toBeUndefined();
    expect(builder.image).not.toHaveBeenCalled();
  });

  test('should return undefined for an empty object source', () => {
    const imageUrl = urlFor({});
    expect(imageUrl).toBeUndefined();
    expect(builder.image).not.toHaveBeenCalled();
  });
});

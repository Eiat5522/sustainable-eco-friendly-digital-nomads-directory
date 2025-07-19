import * as SanityClient from '@sanity/client';
import SanityImageUrl from '@sanity/image-url';

// Mock environment variables
const OLD_ENV = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...OLD_ENV };
});

afterAll(() => {
  process.env = OLD_ENV;
});

describe('Sanity client module', () => {
  it('should use createClient from named export if available', () => {
    (SanityClient as any).createClient = jest.fn(() => ({ test: 'named' }));
    const { createClient } = require('./client');
    expect(createClient()).toEqual({ test: 'named' });
    delete (SanityClient as any).createClient;
  });

  it('should fallback to default.createClient if named export not available', () => {
    (SanityClient as any).default = { createClient: jest.fn(() => ({ test: 'default' })) };
    const { createClient } = require('./client');
    expect(createClient()).toEqual({ test: 'default' });
    delete (SanityClient as any).default;
  });

  it('should create client with env vars or fallback values', () => {
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'abc123';
    process.env.NEXT_PUBLIC_SANITY_DATASET = 'mydataset';
    const { client } = require('./client');
    expect(client.config()).toMatchObject({
      projectId: 'abc123',
      dataset: 'mydataset',
      apiVersion: '2024-01-01',
      useCdn: false,
    });
  });

  it('should fallback to dummy values if env vars are missing', () => {
    delete process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
    delete process.env.NEXT_PUBLIC_SANITY_DATASET;
    const { client } = require('./client');
    expect(client.config()).toMatchObject({
      projectId: 'projectId',
      dataset: 'dataset',
    });
  });

  it('should build image URLs using urlFor', () => {
    // Mock builder.image
    const mockImage = jest.fn((src) => `https://img.url/${src._id}`);
    (SanityImageUrl as any).default = jest.fn(() => ({ image: mockImage }));
    const { urlFor } = require('./client');
    const src = { _id: 'img123' };
    expect(urlFor(src)).toBe('https://img.url/img123');
    delete (SanityImageUrl as any).default;
  });
});

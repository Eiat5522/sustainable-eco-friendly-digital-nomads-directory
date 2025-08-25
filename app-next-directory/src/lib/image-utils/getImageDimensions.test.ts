import { getImageDimensions } from './getImageDimensions';

describe('getImageDimensions', () => {
  it('returns empty object when image is undefined', () => {
    expect(getImageDimensions(undefined)).toEqual({});
  });

  it('extracts width and height when metadata present', () => {
    const image = {
      asset: {
        metadata: {
          dimensions: { width: 800, height: 600 }
        }
      }
    } as any;

    const dims = getImageDimensions(image);
    expect(dims.width).toBe(800);
    expect(dims.height).toBe(600);
    expect(dims.aspectRatio).toBeCloseTo(800 / 600);
  });

  it('returns empty when metadata is missing', () => {
    const image = { asset: { url: 'http://example.com/img.jpg' } } as any;
    expect(getImageDimensions(image)).toEqual({});
  });
});

import { 
  getImageUrlOrPlaceholder, 
  hasValidImageUrl, 
  getLqipFromImage,
  PLACEHOLDER_IMAGES 
} from '../image-helpers';
import { SanityImage } from '@/types/appView';

describe('Image Helper Functions', () => {
  describe('getImageUrlOrPlaceholder', () => {
    it('should return asset URL when valid image provided', () => {
      const validImage: SanityImage = {
        asset: {
          url: 'https://example.com/image.jpg'
        }
      };

      const result = getImageUrlOrPlaceholder(validImage);
      expect(result).toBe('https://example.com/image.jpg');
    });

    it('should return listing placeholder for null image with listing type', () => {
      const result = getImageUrlOrPlaceholder(null, 'listing');
      expect(result).toBe(PLACEHOLDER_IMAGES.listing);
    });

    it('should return city placeholder for undefined image with city type', () => {
      const result = getImageUrlOrPlaceholder(undefined, 'city');
      expect(result).toBe(PLACEHOLDER_IMAGES.city);
    });

    it('should return fallback placeholder by default', () => {
      const result = getImageUrlOrPlaceholder(null);
      expect(result).toBe(PLACEHOLDER_IMAGES.fallback);
    });

    it('should return placeholder when image has no asset', () => {
      const imageWithoutAsset: SanityImage = {
        alt: 'Test image'
      };

      const result = getImageUrlOrPlaceholder(imageWithoutAsset, 'listing');
      expect(result).toBe(PLACEHOLDER_IMAGES.listing);
    });

    it('should return placeholder when asset has no URL', () => {
      const imageWithoutUrl: SanityImage = {
        asset: {
          _id: 'asset-123',
          _ref: 'ref-123'
        }
      };

      const result = getImageUrlOrPlaceholder(imageWithoutUrl);
      expect(result).toBe(PLACEHOLDER_IMAGES.fallback);
    });
  });

  describe('hasValidImageUrl', () => {
    it('should return true for valid image with URL', () => {
      const validImage: SanityImage = {
        asset: {
          url: 'https://example.com/image.jpg'
        }
      };

      expect(hasValidImageUrl(validImage)).toBe(true);
    });

    it('should return false for null image', () => {
      expect(hasValidImageUrl(null)).toBe(false);
    });

    it('should return false for undefined image', () => {
      expect(hasValidImageUrl(undefined)).toBe(false);
    });

    it('should return false for image without asset', () => {
      const imageWithoutAsset: SanityImage = {
        alt: 'Test image'
      };

      expect(hasValidImageUrl(imageWithoutAsset)).toBe(false);
    });

    it('should return false for image without URL', () => {
      const imageWithoutUrl: SanityImage = {
        asset: {
          _id: 'asset-123'
        }
      };

      expect(hasValidImageUrl(imageWithoutUrl)).toBe(false);
    });
  });

  describe('getLqipFromImage', () => {
    it('should return LQIP when available', () => {
      const imageWithLqip: SanityImage = {
        asset: {
          url: 'https://example.com/image.jpg',
          metadata: {
            lqip: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGBkaGx0eH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/2gAMAwEAAhEDEQA/AMS+NKrKYdxqJcVBCJJMWF9H7O2wRRdgzJSLdUcF...'
          }
        }
      };

      const result = getLqipFromImage(imageWithLqip);
      expect(result).toBe('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGBkaGx0eH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/2gAMAwEAAhEDEQA/AMS+NKrKYdxqJcVBCJJMWF9H7O2wRRdgzJSLdUcF...');
    });

    it('should return undefined for null image', () => {
      expect(getLqipFromImage(null)).toBeUndefined();
    });

    it('should return undefined for image without metadata', () => {
      const imageWithoutMetadata: SanityImage = {
        asset: {
          url: 'https://example.com/image.jpg'
        }
      };

      expect(getLqipFromImage(imageWithoutMetadata)).toBeUndefined();
    });

    it('should return undefined for image without LQIP', () => {
      const imageWithoutLqip: SanityImage = {
        asset: {
          url: 'https://example.com/image.jpg',
          metadata: {
            dimensions: { width: 800, height: 600 }
          }
        }
      };

      expect(getLqipFromImage(imageWithoutLqip)).toBeUndefined();
    });
  });

  describe('PLACEHOLDER_IMAGES constants', () => {
    it('should have all required placeholder types', () => {
      expect(PLACEHOLDER_IMAGES.listing).toBe('/images/sustainable_nomads.png');
      expect(PLACEHOLDER_IMAGES.city).toBe('/placeholder-city.jpg');
      expect(PLACEHOLDER_IMAGES.fallback).toBe('/images/fallback.png');
    });
  });
});
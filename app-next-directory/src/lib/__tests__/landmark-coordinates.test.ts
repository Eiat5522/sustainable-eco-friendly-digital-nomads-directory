import { describe, expect, it } from '@jest/globals';
import { LANDMARK_COORDINATES } from '../landmark-coordinates';

describe('landmark-coordinates', () => {
  describe('LANDMARK_COORDINATES', () => {
    it('should export an array of landmarks', () => {
      expect(Array.isArray(LANDMARK_COORDINATES)).toBe(true);
      expect(LANDMARK_COORDINATES.length).toBeGreaterThan(0);
    });

    it('should have landmarks with required properties', () => {
      LANDMARK_COORDINATES.forEach(landmark => {
        expect(landmark).toHaveProperty('searchTerms');
        expect(landmark).toHaveProperty('coordinates');
        expect(Array.isArray(landmark.searchTerms)).toBe(true);
        expect(landmark.searchTerms.length).toBeGreaterThan(0);
        expect(landmark.coordinates).toHaveProperty('latitude');
        expect(landmark.coordinates).toHaveProperty('longitude');
      });
    });

    it('should have valid latitude values', () => {
      LANDMARK_COORDINATES.forEach(landmark => {
        expect(typeof landmark.coordinates.latitude).toBe('number');
        expect(landmark.coordinates.latitude).toBeGreaterThanOrEqual(-90);
        expect(landmark.coordinates.latitude).toBeLessThanOrEqual(90);
      });
    });

    it('should have valid longitude values', () => {
      LANDMARK_COORDINATES.forEach(landmark => {
        expect(typeof landmark.coordinates.longitude).toBe('number');
        expect(landmark.coordinates.longitude).toBeGreaterThanOrEqual(-180);
        expect(landmark.coordinates.longitude).toBeLessThanOrEqual(180);
      });
    });

    it('should have non-empty search terms', () => {
      LANDMARK_COORDINATES.forEach(landmark => {
        landmark.searchTerms.forEach(term => {
          expect(typeof term).toBe('string');
          expect(term.length).toBeGreaterThan(0);
        });
      });
    });

    it('should include Asoke landmark', () => {
      const asoke = LANDMARK_COORDINATES.find(landmark =>
        landmark.searchTerms.some(term => term.toLowerCase().includes('asoke'))
      );
      expect(asoke).toBeDefined();
      expect(asoke?.coordinates.latitude).toBeCloseTo(13.7374652, 5);
      expect(asoke?.coordinates.longitude).toBeCloseTo(100.5642891, 5);
    });

    it('should include Nimman landmark', () => {
      const nimman = LANDMARK_COORDINATES.find(landmark =>
        landmark.searchTerms.some(term => term.toLowerCase().includes('nimman'))
      );
      expect(nimman).toBeDefined();
      expect(nimman?.coordinates.latitude).toBeCloseTo(18.8018871, 5);
      expect(nimman?.coordinates.longitude).toBeCloseTo(98.9674937, 5);
    });

    it('should have unique search terms across landmarks', () => {
      const allTerms = LANDMARK_COORDINATES.flatMap(l => l.searchTerms.map(t => t.toLowerCase()));
      const uniqueTerms = new Set(allTerms);
      expect(allTerms.length).toBe(uniqueTerms.size);
    });
  });
});

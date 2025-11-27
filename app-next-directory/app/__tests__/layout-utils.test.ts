import { describe, expect, it } from '@jest/globals';
import { rootLayoutMetadata } from '../layout.metadata';

describe('layout helpers', () => {
  describe('metadata', () => {
    it('matches expected title and description', () => {
      expect(rootLayoutMetadata).toEqual({
        title: 'SustainableNomads - Eco-Friendly Digital Nomad Directory',
        description:
          'Discover sustainable coworking spaces, cafes, accommodations, and activities for conscious digital nomads worldwide.',
      });
    });
  });
});

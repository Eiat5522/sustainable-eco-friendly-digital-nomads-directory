import type { CityDTO } from '../city';

describe('city types', () => {
  describe('CityDTO type export', () => {
    it('should export CityDTO from dto module', () => {
      const city: CityDTO = {
        id: 'city-123',
        name: 'Bangkok',
        slug: 'bangkok',
        country: 'Thailand'
      };
      expect(city.id).toBe('city-123');
      expect(city.name).toBe('Bangkok');
    });

    it('should accept city with optional fields', () => {
      const city: CityDTO = {
        id: 'city-456',
        name: 'Chiang Mai',
        slug: 'chiang-mai',
        country: 'Thailand',
        sustainabilityScore: 90,
        highlights: ['Mountains', 'Digital Nomad Hub'],
        imageUrl: 'https://example.com/chiang-mai.jpg',
        description: 'Beautiful city in northern Thailand'
      };
      expect(city.sustainabilityScore).toBe(90);
      expect(city.highlights).toContain('Digital Nomad Hub');
    });

    it('should handle multiple cities', () => {
      const cities: CityDTO[] = [
        {
          id: 'city-1',
          name: 'Bangkok',
          slug: 'bangkok',
          country: 'Thailand'
        },
        {
          id: 'city-2',
          name: 'Lisbon',
          slug: 'lisbon',
          country: 'Portugal'
        },
        {
          id: 'city-3',
          name: 'Bali',
          slug: 'bali',
          country: 'Indonesia'
        }
      ];
      expect(cities).toHaveLength(3);
      expect(cities[1].name).toBe('Lisbon');
    });
  });
});

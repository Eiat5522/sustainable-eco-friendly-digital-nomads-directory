// ecoRatingCalculator.test.ts
import { calculateEcoRating } from '../ecoRatingCalculator';

describe('calculateEcoRating', () => {
  it('returns correct rating with default weights', () => {
    const input = {
      energyEfficiency: 1,
      waterConservation: 0.5,
      wasteReduction: 0.5,
      sustainableMaterials: 0.5,
      communityImpact: 0.5,
    };
    // (1*0.25 + 0.5*0.2 + 0.5*0.2 + 0.5*0.2 + 0.5*0.15) / 1 = 0.25 + 0.1 + 0.1 + 0.1 + 0.075 = 0.625 -> rounded to 0.63
    expect(calculateEcoRating(input)).toBeCloseTo(0.63, 2);
  });
  it('returns correct rating with custom weights', () => {
    const input = {
      energyEfficiency: 0.8,
      waterConservation: 0.6,
      wasteReduction: 0.4,
      sustainableMaterials: 0.2,
      communityImpact: 1,
    };
    const weights = {
      energyEfficiency: 0.1,
      waterConservation: 0.1,
      wasteReduction: 0.1,
      sustainableMaterials: 0.1,
      communityImpact: 0.6,
    };
    const expectedEcoRating = 0.8;
    expect(calculateEcoRating(input, weights)).toBeCloseTo(expectedEcoRating, 2);
  });

  it('returns 0 if all input values are zero', () => {
    const input = {
      energyEfficiency: 0,
      waterConservation: 0,
      wasteReduction: 0,
      sustainableMaterials: 0,
      communityImpact: 0,
    };
    expect(calculateEcoRating(input)).toBe(0);
  });

  it('ignores missing fields in input', () => {
    const input = {
      energyEfficiency: 1,
      waterConservation: 1,
      wasteReduction: 0,
      sustainableMaterials: 0,
      communityImpact: 0,
    };
    // Only weights for present fields are counted
    // Present fields: energyEfficiency (1, 0.25), waterConservation (1, 0.25), wasteReduction (0, 0.2), sustainableMaterials (0, 0.2), communityImpact (0, 0.15)
    // total = 1*0.25 + 1*0.2 = 0.45, weightSum = 0.25 + 0.2 = 0.45, result = 0.45 / 0.45 = 1
    expect(calculateEcoRating(input)).toBeCloseTo(1, 2);
  });

  it('returns 0 if weightSum is zero', () => {
    const input = {
      foo: 1,
      bar: 1,
      energyEfficiency: 0,
      waterConservation: 0,
      wasteReduction: 0,
      sustainableMaterials: 0,
      communityImpact: 0,
    };
    const weights = {
      foo: 0,
      bar: 0,
      energyEfficiency: 0,
      waterConservation: 0,
      wasteReduction: 0,
      sustainableMaterials: 0,
      communityImpact: 0,
    };
    expect(calculateEcoRating(input, weights)).toBe(0);
  });
});


// Modular eco rating calculation logic.

export type EcoRatingInput = {
  energyEfficiency: number; // 0-1
  waterConservation: number; // 0-1
  wasteReduction: number; // 0-1
  sustainableMaterials: number; // 0-1
  communityImpact: number; // 0-1
  [key: string]: number;
};

export type EcoRatingWeights = {
  energyEfficiency?: number;
  waterConservation?: number;
  wasteReduction?: number;
  sustainableMaterials?: number;
  communityImpact?: number;
  [key: string]: number | undefined;
};

export function calculateEcoRating(
  input: Record<string, number>,
  weights: Record<string, number> = {
    energyEfficiency: 0.25,
    waterConservation: 0.2,
    wasteReduction: 0.2,
    sustainableMaterials: 0.2,
    communityImpact: 0.15,
  }
): number {
  let total = 0;
  let weightSum = 0;
  for (const key of Object.keys(input)) {
    const value = input[key];
    const weight = weights[key] ?? 0;
    // Only consider fields present in input and with non-zero weight
    if (weight > 0) {
      total += value * weight;
      weightSum += weight;
    }
  }
  if (weightSum === 0) return 0;
  return Math.round((total / weightSum) * 100) / 100;
}
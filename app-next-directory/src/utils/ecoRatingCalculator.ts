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
  // Only include weights for input fields where value > 0 and weight > 0
  for (const key of Object.keys(input)) {
    const value = input[key];
    const weight = weights[key] ?? 0;
    if (value > 0 && weight > 0) {
      total += value * weight;
      weightSum += weight;
    }
  }
  if (weightSum === 0) return 0;
  // Add Number.EPSILON to avoid floating-point rounding errors (e.g. 0.625 → 0.63)
  const rawScore = total / weightSum;
  const rounded = Math.round((rawScore + Number.EPSILON) * 100) / 100;
  return rounded;
}
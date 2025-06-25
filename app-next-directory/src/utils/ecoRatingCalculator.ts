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
  input: EcoRatingInput,
  weights?: EcoRatingWeights
): number {
  const defaultWeights: EcoRatingWeights = {
    energyEfficiency: 0.25,
    waterConservation: 0.2,
    wasteReduction: 0.2,
    sustainableMaterials: 0.2,
    communityImpact: 0.15,
  };

  const mergedWeights = { ...defaultWeights, ...weights };
  let total = 0;
  let weightSum = 0;

  for (const key in mergedWeights) {
    if (typeof input[key] === 'number' && typeof mergedWeights[key] === 'number') {
      total += input[key] * (mergedWeights[key] as number);
      weightSum += mergedWeights[key] as number;
    }
  }

  if (weightSum === 0) return 0;
  return Math.round((total / weightSum) * 100) / 100;
}
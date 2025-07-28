/**
 * Utility functions for displaying price ranges in a user-friendly format
 */

export type PriceRange = 'budget' | 'moderate' | 'premium';

export interface PriceRangeInfo {
  label: string;
  estimatedRange: string;
  displayText: string;
  description: string;
}

/**
 * Maps categorical price ranges to user-friendly display information
 * Based on typical accommodation pricing in Thailand/Southeast Asia
 */
export const PRICE_RANGE_MAP: Record<PriceRange, PriceRangeInfo> = {
  budget: {
    label: 'Budget',
    estimatedRange: '$15-40',
    displayText: 'Budget ($15-40)',
    description: 'Affordable options for budget-conscious travelers'
  },
  moderate: {
    label: 'Moderate', 
    estimatedRange: '$40-100',
    displayText: 'Moderate ($40-100)',
    description: 'Mid-range options with good value and comfort'
  },
  premium: {
    label: 'Premium',
    estimatedRange: '$100+',
    displayText: 'Premium ($100+)',
    description: 'High-end options with luxury amenities'
  }
};

/**
 * Gets the display text for a price range
 * @param priceRange - The categorical price range
 * @param includeEstimate - Whether to include estimated price range (default: true)
 * @returns Formatted display text
 */
export function getPriceRangeDisplay(
  priceRange?: PriceRange | string,
  includeEstimate: boolean = true
): string {
  if (!priceRange || !(priceRange in PRICE_RANGE_MAP)) {
    return 'Price on request';
  }

  const info = PRICE_RANGE_MAP[priceRange as PriceRange];
  return includeEstimate ? info.displayText : info.label;
}

/**
 * Gets price range information for detailed displays
 * @param priceRange - The categorical price range
 * @returns Complete price range information or null if invalid
 */
export function getPriceRangeInfo(priceRange?: PriceRange | string): PriceRangeInfo | null {
  if (!priceRange || !(priceRange in PRICE_RANGE_MAP)) {
    return null;
  }

  return PRICE_RANGE_MAP[priceRange as PriceRange];
}

/**
 * Gets price range emoji representation
 * @param priceRange - The categorical price range
 * @returns Emoji representation (💰, 💰💰, 💰💰💰)
 */
export function getPriceRangeEmoji(priceRange?: PriceRange | string): string {
  if (!priceRange) return '💰';
  
  switch (priceRange) {
    case 'budget':
      return '💰';
    case 'moderate':
      return '💰💰';
    case 'premium':
      return '💰💰💰';
    default:
      return '💰';
  }
}

/**
 * Gets a simple display for accommodation pricing per night
 * @param priceRange - The categorical price range
 * @param accommodationType - Type of accommodation (default: 'accommodation')
 * @returns Formatted display text with per-unit pricing
 */
export function getAccommodationPriceDisplay(
  priceRange?: PriceRange | string,
  accommodationType: string = 'accommodation'
): string {
  const baseDisplay = getPriceRangeDisplay(priceRange, true);
  
  if (accommodationType === 'Workspace' || accommodationType === 'Café') {
    return `${baseDisplay}/day`;
  }
  
  return `${baseDisplay}/night`;
}
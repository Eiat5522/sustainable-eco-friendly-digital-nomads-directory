/**
 * Carbon Awareness API
 *
 * This library provides functions to determine the carbon intensity
 * of electricity in the user's region, which can be used to adapt
 * UI rendering and optimize for lower environmental impact.
 */

// Cache the carbon intensity data to reduce API calls
let cachedCarbonData: {
  intensity: number;
  timestamp: number;
  region: string;
} | null = null;

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache

/**
 * Gets the user's approximate region based on IP geolocation
 */
export async function getUserRegion(): Promise<string> {
  try {
    // Use a lightweight geolocation service
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return data.country_code;
  } catch (error) {
    console.error('Error fetching user region:', error);
    return 'UNKNOWN';
  }
}

/**
 * Gets the carbon intensity for the user's region
 * Returns value in gCO2eq/kWh
 */
export async function getCarbonIntensity(): Promise<number> {
  // Check if we have valid cached data
  if (cachedCarbonData &&
      (Date.now() - cachedCarbonData.timestamp) < CACHE_DURATION) {
    return cachedCarbonData.intensity;
  }

  try {
    const region = await getUserRegion();

    // Use the Electricity Maps API (or similar service)
    // Note: This would require proper API keys in production
    const response = await fetch(
      `https://api.electricitymap.org/v3/carbon-intensity/latest?zone=${region}`,
      {
        headers: {
          'auth-token': process.env.NEXT_PUBLIC_ELECTRICITY_MAP_TOKEN || '',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch carbon intensity data');
    }

    const data = await response.json();
    const intensity = data.carbonIntensity;

    // Cache the result
    cachedCarbonData = {
      intensity,
      timestamp: Date.now(),
      region
    };

    return intensity;
  } catch (error) {
    console.error('Error fetching carbon intensity:', error);

    // Fallback to moderate intensity value
    return 250; // Average global carbon intensity as fallback
  }
}

/**
 * Determines if the app should use power-saving mode based on carbon intensity
 */
export function shouldUsePowerSavingMode(carbonIntensity: number): boolean {
  // High carbon intensity regions should use power saving mode
  return carbonIntensity > 300;
}

/**
 * Calculates page carbon footprint
 * Returns estimated CO2 in grams
 */
export function calculatePageCarbonFootprint(
  pageWeight: number, // in KB
  carbonIntensity: number // in gCO2eq/kWh
): number {
  // Formula based on Website Carbon Calculator methodology
  const energyConsumption = pageWeight * 0.000002; // kWh
  const carbonEmission = energyConsumption * carbonIntensity;
  return carbonEmission;
}

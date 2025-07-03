/**
 * Carbon Awareness API
 *
 * This library provides functions to determine the carbon intensity
 * of electricity in the user's region, which can be used to adapt
 * UI rendering and optimize for lower environmental impact.
 */
 
// Cache the carbon intensity data to reduce API calls
export let cachedCarbonData: {
  intensity: number;
  timestamp: number;
  region: string;
} | null = null;

/**
 * Clears the cached carbon data (for testing or manual reset)
 */
export function clearCarbonCache() {
  cachedCarbonData = null;
}

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache

/**
 * Gets the user's approximate region based on IP geolocation
 */
export async function getUserRegion(): Promise<string> {
  try {
    const response = await fetch('https://ipapi.co/json/');
    if (!response.ok) {
      throw new Error('Failed to fetch region');
    }
    const data = await response.json();
    if (!data || typeof data.country_code !== 'string' || data.country_code.length !== 2) {
      throw new Error('Malformed region data');
    }
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
export async function getCarbonIntensity(getUserRegionFn: () => Promise<string> = getUserRegion): Promise<number> {
  try {
    const region = await getUserRegionFn();
    if (!region || typeof region !== 'string' || region === 'UNKNOWN') {
      throw new Error('Invalid region for carbon intensity');
    }

    // Check cache validity: region matches and not expired
    if (
      cachedCarbonData &&
      cachedCarbonData.region === region &&
      Date.now() - cachedCarbonData.timestamp < CACHE_DURATION
    ) {
      return cachedCarbonData.intensity;
    }

    const token = process.env.NEXT_PUBLIC_ELECTRICITY_MAP_TOKEN;
    if (!token || typeof token !== 'string') {
      throw new Error('Missing electricity map API token');
    }

    const response = await fetch(
      `https://api.electricitymap.org/v3/carbon-intensity/latest?zone=${region}`,
      {
        headers: {
          'auth-token': token,
        },
      }
    );

    if (!response.ok) {
      return 250;
    }

    const data = await response.json();
    const intensity =
      typeof data.carbonIntensity === 'number'
        ? data.carbonIntensity
        : undefined;

    if (typeof intensity === 'number' && !isNaN(intensity)) {
      cachedCarbonData = {
        intensity,
        timestamp: Date.now(),
        region,
      };
      return intensity;
    } else {
      return 250;
    }
  } catch (error) {
    console.error('Error fetching carbon intensity:', error);
    return 250;
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

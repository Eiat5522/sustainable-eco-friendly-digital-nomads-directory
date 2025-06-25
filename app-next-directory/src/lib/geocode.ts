import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { LANDMARK_COORDINATES } from 'landmark-coordinates';
import { type Listing } from '@/types/listings';
// Coordinates type for geocoding results
export interface Coordinates {
  latitude: number | null;
  longitude: number | null;
}

export function findLandmarkCoordinates(address: string): Coordinates | null {
  if (!address) return null;
  const addressLower = address.toLowerCase();
  for (const landmark of LANDMARK_COORDINATES) {
    for (const term of landmark.searchTerms) {
      // Match if the term is a substring anywhere in the address (case-insensitive)
      if (addressLower.includes(term.toLowerCase())) {
        return landmark.coordinates;
      }
    }
  }
  return null;
}

export async function geocodeAddress(address: string, city: string): Promise<Coordinates> {
  try {
    // First check for landmark coordinates
    const landmarkCoords = findLandmarkCoordinates(address);
    if (landmarkCoords) {
      console.log(`Found landmark coordinates for: ${address}`);
      return landmarkCoords;
    }

    // Add delay to respect Nominatim's usage policy (1 request per second)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try with full address
    const searchQuery = `${address}, ${city}, Thailand`;
    console.log(`Geocoding: ${searchQuery}`);
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'Sustainable Digital Nomads Directory/1.0'
        }
      }
    );

    const data = (await response.json()) as { lat: string; lon: string; }[];
    
    if (data && data[0]) {
      console.log(`Found coordinates: ${data[0].lat}, ${data[0].lon}`);
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      };
    }
    
    // Check for landmark coordinates in city name
    const cityLandmarkCoords = findLandmarkCoordinates(city);
    if (cityLandmarkCoords) {
      console.log(`Found landmark coordinates for city: ${city}`);
      return cityLandmarkCoords;
    }

    // If still no results, try with just city name
    console.log(`No results found, trying with city: ${city}, Thailand`);
    const cityResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${city}, Thailand`)}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'Sustainable Digital Nomads Directory/1.0'
        }
      }
    );

    const cityData = (await cityResponse.json()) as { lat: string; lon: string; }[];
    
    if (cityData && cityData[0]) {
      console.log(`Found city coordinates: ${cityData[0].lat}, ${cityData[0].lon}`);
      return {
        latitude: parseFloat(cityData[0].lat),
        longitude: parseFloat(cityData[0].lon)
      };
    }
    
    console.log(`No coordinates found for: ${searchQuery}`);
    return {
      latitude: null,
      longitude: null
    };
  } catch (error) {
    console.error(`Error geocoding address: ${address}`, error);
    return {
      latitude: null,
      longitude: null
    };
  }
}

export async function updateListingsWithCoordinates(): Promise<void> {
  try {
    // Read listings file
    const listingsPath = path.join(process.cwd(), 'src/data/listings.json');
    const listingsData = await fs.readFile(listingsPath, 'utf-8');
    const listings = JSON.parse(listingsData) as Listing[];

    // Geocode each listing's address
    for (const listing of listings) {
      if (
        !listing.coordinates ||
        !listing.coordinates.latitude ||
        !listing.coordinates.longitude
      ) {
        console.log(`\nProcessing: ${listing.name}`);
        const coordinates = await geocodeAddress(listing.address_string, listing.city);
        listing.coordinates = coordinates;
      }
    }

    // Write updated listings back to file
    await fs.writeFile(listingsPath, JSON.stringify(listings, null, 2));
    console.log('\nSuccessfully updated listings with coordinates');

  } catch (error) {
    console.error('Error updating listings with coordinates:', error);
  }
}

// Execute if run directly
if (require.main === module) {
  updateListingsWithCoordinates();
}

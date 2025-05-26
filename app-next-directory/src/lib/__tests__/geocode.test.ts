// Jest unit tests for geocode.ts
import { jest } from '@jest/globals';
import * as geocodeModule from '../geocode';
import { LANDMARK_COORDINATES } from '../landmark-coordinates';

jest.mock('node-fetch', () => jest.fn());
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
}));
jest.mock('path', () => ({
  join: jest.fn(() => '/mocked/path/listings.json'),
}));
jest.mock('../landmark-coordinates', () => ({
  LANDMARK_COORDINATES: [
    {
      searchTerms: ['Landmark A', 'Avenue'],
      coordinates: { latitude: 1.23, longitude: 4.56 },
    },
    {
      searchTerms: ['Landmark B'],
      coordinates: { latitude: 7.89, longitude: 0.12 },
    },
  ],
}));

const fetch = require('node-fetch');
const fs = require('fs/promises');

describe('findLandmarkCoordinates', () => {
  it('returns coordinates for a matching landmark', () => {
    const result = geocodeModule['findLandmarkCoordinates']('123 Avenue');
    expect(result).toEqual({ latitude: 1.23, longitude: 4.56 });
  });

  it('returns null if no landmark matches', () => {
    const result = geocodeModule['findLandmarkCoordinates']('Unknown Place');
    expect(result).toBeNull();
  });

  it('is case-insensitive for search terms', () => {
    const result = geocodeModule['findLandmarkCoordinates']('landmark a');
    expect(result).toEqual({ latitude: 1.23, longitude: 4.56 });
  });
});

describe('geocodeAddress', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns landmark coordinates if found', async () => {
    const spy = jest.spyOn(geocodeModule, 'findLandmarkCoordinates').mockReturnValue({ latitude: 1.23, longitude: 4.56 });
    const result = await geocodeModule.geocodeAddress('Landmark A', 'Bangkok');
    expect(result).toEqual({ latitude: 1.23, longitude: 4.56 });
    spy.mockRestore();
  });

  it('returns coordinates from fetch if no landmark found', async () => {
    jest.spyOn(geocodeModule, 'findLandmarkCoordinates').mockReturnValueOnce(null).mockReturnValueOnce(null);
    fetch.mockResolvedValueOnce({
      json: async () => [{ lat: '13.75', lon: '100.5' }],
    });
    const result = await geocodeModule.geocodeAddress('Some Address', 'Bangkok');
    expect(result).toEqual({ latitude: 13.75, longitude: 100.5 });
  });

  it('returns city landmark coordinates if address fetch fails but city is a landmark', async () => {
    jest.spyOn(geocodeModule, 'findLandmarkCoordinates').mockReturnValueOnce(null).mockReturnValueOnce({ latitude: 7.89, longitude: 0.12 });
    fetch.mockResolvedValueOnce({ json: async () => [] });
    const result = await geocodeModule.geocodeAddress('Unknown Address', 'Landmark B');
    expect(result).toEqual({ latitude: 7.89, longitude: 0.12 });
  });

  it('returns coordinates from city fetch if address fetch fails', async () => {
    jest.spyOn(geocodeModule, 'findLandmarkCoordinates').mockReturnValue(null);
    fetch
      .mockResolvedValueOnce({ json: async () => [] }) // address fetch
      .mockResolvedValueOnce({ json: async () => [{ lat: '15.0', lon: '101.0' }] }); // city fetch
    const result = await geocodeModule.geocodeAddress('Unknown Address', 'Bangkok');
    expect(result).toEqual({ latitude: 15.0, longitude: 101.0 });
  });

  it('returns null coordinates if all fetches fail', async () => {
    jest.spyOn(geocodeModule, 'findLandmarkCoordinates').mockReturnValue(null);
    fetch
      .mockResolvedValueOnce({ json: async () => [] }) // address fetch
      .mockResolvedValueOnce({ json: async () => [] }); // city fetch
    const result = await geocodeModule.geocodeAddress('Unknown Address', 'Unknown City');
    expect(result).toEqual({ latitude: null, longitude: null });
  });

  it('returns null coordinates on fetch error', async () => {
    jest.spyOn(geocodeModule, 'findLandmarkCoordinates').mockReturnValue(null);
    fetch.mockRejectedValueOnce(new Error('Network error'));
    const result = await geocodeModule.geocodeAddress('Error Address', 'Bangkok');
    expect(result).toEqual({ latitude: null, longitude: null });
  });
});

describe('updateListingsWithCoordinates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates listings with missing coordinates', async () => {
    const listings = [
      { name: 'A', address_string: 'Landmark A', city: 'Bangkok', coordinates: { latitude: null, longitude: null } },
      { name: 'B', address_string: 'Somewhere', city: 'Bangkok', coordinates: { latitude: 1, longitude: 2 } },
    ];
    fs.readFile.mockResolvedValueOnce(JSON.stringify(listings));
    fs.writeFile.mockResolvedValueOnce();
    jest.spyOn(geocodeModule, 'geocodeAddress').mockResolvedValue({ latitude: 1.23, longitude: 4.56 });

    await geocodeModule.updateListingsWithCoordinates();

    expect(fs.readFile).toHaveBeenCalled();
    expect(fs.writeFile).toHaveBeenCalledWith(
      '/mocked/path/listings.json',
      expect.stringContaining('"latitude":1.23'),
    );
  });

  it('handles errors gracefully', async () => {
    fs.readFile.mockRejectedValueOnce(new Error('File error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await geocodeModule.updateListingsWithCoordinates();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error updating listings with coordinates:',
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });
});

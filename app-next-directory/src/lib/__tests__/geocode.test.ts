/**
 * Jest unit tests for geocode.ts
 */
import { jest } from '@jest/globals';
import * as geocodeModule from '../geocode';

type MockFetchResponse = {
  json: () => Promise<unknown>;
};

jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
}));
jest.mock('path', () => ({
  join: jest.fn(() => 'D:\\mocked\\path\\listings.json'),
}));
/* Manual mock for landmark-coordinates is provided in __mocks__/landmark-coordinates.ts */

/**
 * Ensure global.fetch is a Jest mock function for all tests.
 */
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

const getFetchMock = () => global.fetch as jest.MockedFunction<typeof fetch>;

const _fs = require('node:fs/promises') as jest.Mocked<typeof import('fs/promises')>;

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

  it('returns null for empty string', () => {
    const result = geocodeModule['findLandmarkCoordinates']('');
    expect(result).toBeNull();
  });

  it('returns null for undefined', () => {
    const result = geocodeModule['findLandmarkCoordinates'](undefined);
    expect(result).toBeNull();
  });

  it('returns null for null', () => {
    const result = geocodeModule['findLandmarkCoordinates'](null);
    expect(result).toBeNull();
  });

  it('handles landmark with mixed-case characters', () => {
    const result = geocodeModule['findLandmarkCoordinates']('LaNdMaRk A');
    expect(result).toEqual({ latitude: 1.23, longitude: 4.56 });
  });

  it('handles landmark with leading/trailing spaces', () => {
    const result = geocodeModule['findLandmarkCoordinates']('  Landmark A  ');
    expect(result).toEqual({ latitude: 1.23, longitude: 4.56 });
  });

  it('handles landmark with special characters', () => {
    const result = geocodeModule['findLandmarkCoordinates']('Landmark A!');
    expect(result).toBeNull();
  });
});

/**
 * @jest-environment node
 *
 * Tests for geocodeAddress, using jest.doMock to mock findLandmarkCoordinates.
 */
describe('geocodeAddress', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
  });

  type LandmarkCoordinatesFn = (
    address?: string | null,
    city?: string | null
  ) => { latitude: number; longitude: number } | null;

  function getGeocodeModuleWithMockedLandmark(mockImpl: LandmarkCoordinatesFn) {
    jest.doMock('../geocode', () => {
      const actual = jest.requireActual('../geocode');
      // Use Object.assign to avoid TS/ESM spread error
      return Object.assign({}, actual, {
        findLandmarkCoordinates: mockImpl,
      });
    });
    return require('../geocode') as typeof import('../geocode');
  }

  it('returns landmark coordinates if found', async () => {
    const geocodeModule = getGeocodeModuleWithMockedLandmark(
      jest.fn().mockReturnValue({ latitude: 1.23, longitude: 4.56 })
    );
    const result = await geocodeModule.geocodeAddress('Landmark A', 'Bangkok');
    expect(result).toEqual({ latitude: 1.23, longitude: 4.56 });
  });

  it('returns coordinates from fetch if no landmark found', async () => {
    const geocodeModule = getGeocodeModuleWithMockedLandmark(jest.fn().mockReturnValue(null));
    getFetchMock().mockResolvedValueOnce({
      json: async () => [{ lat: '13.75', lon: '100.5' }],
    } as unknown as Response);
    const result = await geocodeModule.geocodeAddress('Some Address', 'Bangkok');
    expect(result).toEqual({ latitude: 13.75, longitude: 100.5 });
  });

  it('returns city landmark coordinates if address fetch fails but city is a landmark', async () => {
    const geocodeModule = getGeocodeModuleWithMockedLandmark(
      jest.fn().mockReturnValueOnce(null).mockReturnValueOnce({ latitude: 7.89, longitude: 0.12 })
    );
    getFetchMock().mockResolvedValueOnce({ json: async () => [] } as unknown as Response);
    const result = await geocodeModule.geocodeAddress('Unknown Address', 'Landmark B');
    expect(result).toEqual({ latitude: 7.89, longitude: 0.12 });
  });

  it('returns coordinates from city fetch if address fetch fails', async () => {
    const geocodeModule = getGeocodeModuleWithMockedLandmark(jest.fn().mockReturnValue(null));
    getFetchMock().mockResolvedValueOnce({ json: async () => [] } as unknown as Response); // address fetch
    getFetchMock().mockResolvedValueOnce({
      json: async () => [{ lat: '15.0', lon: '101.0' }],
    } as unknown as Response); // city fetch
    const result = await geocodeModule.geocodeAddress('Unknown Address', 'Bangkok');
    expect(result).toEqual({ latitude: 15.0, longitude: 101.0 });
  });

  it('returns null coordinates if all fetches fail', async () => {
    const geocodeModule = getGeocodeModuleWithMockedLandmark(jest.fn().mockReturnValue(null));
    getFetchMock().mockResolvedValueOnce({ json: async () => [] } as unknown as Response); // address fetch
    getFetchMock().mockResolvedValueOnce({ json: async () => [] } as unknown as Response); // city fetch
    const result = await geocodeModule.geocodeAddress('Unknown Address', 'Unknown City');
    expect(result).toEqual({ latitude: null, longitude: null });
  });

  it('returns null coordinates on fetch error', async () => {
    const geocodeModule = getGeocodeModuleWithMockedLandmark(jest.fn().mockReturnValue(null));
    getFetchMock().mockRejectedValueOnce(new Error('Network error'));
    const result = await geocodeModule.geocodeAddress('Error Address', 'Bangkok');
    expect(result).toEqual({ latitude: null, longitude: null });
  });

  it('returns null coordinates for empty address and city', async () => {
    const geocodeModule = getGeocodeModuleWithMockedLandmark(jest.fn().mockReturnValue(null));
    getFetchMock().mockResolvedValueOnce({ json: async () => [] } as unknown as Response);
    getFetchMock().mockResolvedValueOnce({ json: async () => [] } as unknown as Response);
    const result = await geocodeModule.geocodeAddress('', '');
    expect(result).toEqual({ latitude: null, longitude: null });
  });

  it('returns null coordinates for undefined address and city', async () => {
    const geocodeModule = getGeocodeModuleWithMockedLandmark(jest.fn().mockReturnValue(null));
    getFetchMock().mockResolvedValueOnce({ json: async () => [] } as unknown as Response);
    getFetchMock().mockResolvedValueOnce({ json: async () => [] } as unknown as Response);
    const result = await geocodeModule.geocodeAddress(undefined, undefined);
    expect(result).toEqual({ latitude: null, longitude: null });
  });

  it('returns null coordinates for null address and city', async () => {
    const geocodeModule = getGeocodeModuleWithMockedLandmark(jest.fn().mockReturnValue(null));
    getFetchMock().mockResolvedValueOnce({ json: async () => [] } as unknown as Response);
    getFetchMock().mockResolvedValueOnce({ json: async () => [] } as unknown as Response);
    const result = await geocodeModule.geocodeAddress(null, null);
    expect(result).toEqual({ latitude: null, longitude: null });
  });

  it('handles API returning a non-array/non-object response', async () => {
    const geocodeModule = getGeocodeModuleWithMockedLandmark(jest.fn().mockReturnValue(null));
    getFetchMock().mockResolvedValueOnce({ json: async () => 'not json' } as unknown as Response);
    const result = await geocodeModule.geocodeAddress('Address', 'City');
    expect(result).toEqual({ latitude: null, longitude: null });
  });

  it('handles API returning a response with missing lat/lon', async () => {
    const geocodeModule = getGeocodeModuleWithMockedLandmark(jest.fn().mockReturnValue(null));
    getFetchMock().mockResolvedValueOnce({ json: async () => [{}] } as unknown as Response);
    const result = await geocodeModule.geocodeAddress('Address', 'City');
    expect(result).toEqual({ latitude: null, longitude: null });
  });

  it('handles API returning a response with null lat/lon', async () => {
    const geocodeModule = getGeocodeModuleWithMockedLandmark(jest.fn().mockReturnValue(null));
    getFetchMock().mockResolvedValueOnce({
      json: async () => [{ lat: null, lon: null }],
    } as unknown as Response);
    const result = await geocodeModule.geocodeAddress('Address', 'City');
    expect(result).toEqual({ latitude: null, longitude: null });
  });

  it('handles API returning a response with undefined lat/lon', async () => {
    const geocodeModule = getGeocodeModuleWithMockedLandmark(jest.fn().mockReturnValue(null));
    getFetchMock().mockResolvedValueOnce({
      json: async () => [{ lat: undefined, lon: undefined }],
    } as unknown as Response);
    const result = await geocodeModule.geocodeAddress('Address', 'City');
    expect(result).toEqual({ latitude: null, longitude: null });
  });

  it('falls back to city fetch when direct object response lacks coordinates', async () => {
    const geocodeModule = getGeocodeModuleWithMockedLandmark(jest.fn().mockReturnValue(null));
    getFetchMock().mockResolvedValueOnce({
      json: async () => ({ latitude: undefined, longitude: undefined }),
    } as unknown as Response);
    getFetchMock().mockResolvedValueOnce({
      json: async () => [{ lat: '42.1', lon: '7.1' }],
    } as unknown as Response);
    const result = await geocodeModule.geocodeAddress('Unknown Address', 'Bangkok');
    expect(result).toEqual({ latitude: 42.1, longitude: 7.1 });
  });
});

/**
 * @jest-environment node
 *
 * Tests for updateListingsWithCoordinates, including error and edge cases.
 */
describe('updateListingsWithCoordinates', () => {
  let _geocodeModule: typeof import('../geocode');
  let fs: typeof import('fs/promises');
  let _path: typeof import('path');
  const mockedPath = 'D:\\mocked\\path\\listings.json';

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.doMock('fs/promises', () => ({
      readFile: jest.fn(),
      writeFile: jest.fn(),
    }));
    jest.doMock('path', () => ({
      join: jest.fn(() => mockedPath),
    }));
    fs = require('node:fs/promises');
    _path = require('node:path');
    _geocodeModule = require('../geocode');
  });

  it('updates listings with missing coordinates', async () => {
    const listings = [
      {
        name: 'A',
        address: 'Landmark A',
        city: 'Bangkok',
        coordinates: { latitude: null, longitude: null },
      },
      {
        name: 'B',
        address: 'Somewhere',
        city: 'Bangkok',
        coordinates: { latitude: 1, longitude: 2 },
      },
    ];
    // Mock readFile to only resolve for the expected path
    // Move all mocking and requiring inside the test to ensure correct order
    jest.resetModules();
    // Use a shared mock object so we can assert calls after require()
    const fsMock = {
      readFile: jest.fn(async (pathArg: string) => {
        if (
          pathArg === mockedPath ||
          pathArg === '/mocked/path/listings.json' ||
          pathArg.replaceAll('\\', '/').endsWith('/mocked/path/listings.json') ||
          pathArg.endsWith('listings.json')
        ) {
          return JSON.stringify(listings);
        }
        const err = new Error(`ENOENT: no such file or directory, open '${pathArg}'`);
        (err as NodeJS.ErrnoException).code = 'ENOENT';
        throw err;
      }),
      writeFile: jest.fn().mockImplementation(() => Promise.resolve()),
    };
    jest.doMock('fs/promises', () => fsMock);
    jest.doMock('path', () => ({
      join: jest.fn(() => mockedPath),
    }));
    const _fs = require('node:fs/promises');
    const path = require('node:path');
    const geocodeModule = require('../geocode');

    // Use a local mock for geocodeAddress
    const mockGeocodeAddress = jest
      .fn<() => Promise<{ latitude: number; longitude: number }>>()
      .mockResolvedValue({ latitude: 1.23, longitude: 4.56 });

    await geocodeModule.updateListingsWithCoordinates({
      fs: fsMock,
      path,
      geocodeAddress: mockGeocodeAddress,
      listingsPath: mockedPath,
    });

    expect(fsMock.readFile).toHaveBeenCalled();
    expect(fsMock.writeFile).toHaveBeenCalledWith(
      mockedPath,
      expect.stringContaining('"latitude": 1.23')
    );
  });

  it('handles errors gracefully', async () => {
    jest.resetModules();
    const fsMock = {
      readFile: jest.fn().mockRejectedValueOnce(new Error('File error')),
      writeFile: jest.fn(),
    };
    jest.doMock('fs/promises', () => fsMock);
    jest.doMock('path', () => ({
      join: jest.fn(() => mockedPath),
    }));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const geocodeModule = require('../geocode');
    const updateListingsWithCoordinates = async () => {
      try {
        await geocodeModule.updateListingsWithCoordinates();
      } catch (_error: unknown) {}
    };
    await updateListingsWithCoordinates();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error updating listings with coordinates:',
      expect.anything()
    );
    consoleSpy.mockRestore();
  });

  /**
   * @description
   * Handles invalid JSON in listings file gracefully.
   */
  it('handles invalid JSON in listings file', async () => {
    jest.resetModules();
    const fsMock = {
      readFile: jest.fn().mockResolvedValueOnce('not a json'),
      writeFile: jest.fn(),
    };
    jest.doMock('fs/promises', () => fsMock);
    jest.doMock('path', () => ({
      join: jest.fn(() => mockedPath),
    }));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const geocodeModule = require('../geocode');
    const updateListingsWithCoordinates = async () => {
      try {
        await geocodeModule.updateListingsWithCoordinates();
      } catch (_error: unknown) {}
    };
    await updateListingsWithCoordinates();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error updating listings with coordinates:',
      expect.anything()
    );
    consoleSpy.mockRestore();
  });

  /**
   * @description
   * Handles empty listings file gracefully.
   */
  it('handles empty listings file', async () => {
    jest.resetModules();
    const fsMock = {
      readFile: jest.fn().mockResolvedValueOnce(''),
      writeFile: jest.fn(),
    };
    jest.doMock('fs/promises', () => fsMock);
    jest.doMock('path', () => ({
      join: jest.fn(() => mockedPath),
    }));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const geocodeModule = require('../geocode');
    const updateListingsWithCoordinates = async () => {
      try {
        await geocodeModule.updateListingsWithCoordinates();
      } catch (_error: unknown) {}
    };
    await updateListingsWithCoordinates();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error updating listings with coordinates:',
      expect.anything()
    );
    consoleSpy.mockRestore();
  });

  it('allows overriding the listings path explicitly', async () => {
    jest.resetModules();
    const customPath = '/tmp/custom/listings.json';
    const fsMock = {
      readFile: jest.fn(async (requestedPath: string) => {
        if (requestedPath === customPath) {
          return JSON.stringify([
            {
              name: 'Override Listing',
              address: 'Landmark A',
              city: 'Bangkok',
              coordinates: { latitude: null, longitude: null },
            },
          ]);
        }
        throw new Error('Unexpected path');
      }),
      writeFile: jest.fn().mockResolvedValue(undefined),
    };
    jest.doMock('fs/promises', () => fsMock);
    jest.doMock('path', () => ({
      join: jest.fn(() => 'unused-default-path'),
    }));

    const geocodeModule = require('../geocode');
    const mockGeocodeAddress = jest.fn().mockResolvedValue({ latitude: 4, longitude: 5 });

    await geocodeModule.updateListingsWithCoordinates({
      fs: fsMock,
      path: require('node:path'),
      geocodeAddress: mockGeocodeAddress,
      listingsPath: customPath,
    });

    expect(fsMock.readFile).toHaveBeenCalledWith(customPath, 'utf-8');
    expect(fsMock.writeFile).toHaveBeenCalledWith(
      customPath,
      expect.stringContaining('"latitude": 4')
    );
  });
});

// Jest unit tests for carbon-awareness.ts

// Use jest.mock to allow mocking of getUserRegion (which is a read-only export)
jest.mock('../carbon-awareness', () => {
  const actual = jest.requireActual('../carbon-awareness');
  return {
    ...actual,
    getUserRegion: jest.fn(),
  };
});

import * as carbon from '../carbon-awareness';

/**
 * @fileoverview
 * Jest unit tests for carbon-awareness.ts.
 * Ensures robust async handling, proper mocking, and modern Jest best practices.
 */

describe('carbon-awareness', () => {
  let originalFetch: typeof global.fetch;

  beforeAll(() => {
    originalFetch = global.fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe('getUserRegion', () => {
    /**
     * Ensures fetch is mocked and restored for each test.
     */
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('returns country code from API', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({ country_code: 'US' }),
      });
      (carbon.getUserRegion as jest.Mock).mockReset();
      (carbon.getUserRegion as jest.Mock).mockImplementation(jest.requireActual('../carbon-awareness').getUserRegion);
      const region = await carbon.getUserRegion();
      expect(region).toBe('US');
    });

    it('returns UNKNOWN on fetch error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('fail'));
      (carbon.getUserRegion as jest.Mock).mockReset();
      (carbon.getUserRegion as jest.Mock).mockImplementation(jest.requireActual('../carbon-awareness').getUserRegion);
      const region = await carbon.getUserRegion();
      expect(region).toBe('UNKNOWN');
    });
  });

  describe('getCarbonIntensity', () => {
    let originalEnv: any;

    beforeEach(() => {
      originalEnv = process.env.NEXT_PUBLIC_ELECTRICITY_MAP_TOKEN;
      process.env.NEXT_PUBLIC_ELECTRICITY_MAP_TOKEN = 'test-token';
      global.fetch = jest.fn();
      // Clear cache to ensure test isolation
      carbon.clearCarbonCache();
    });

    afterEach(() => {
      process.env.NEXT_PUBLIC_ELECTRICITY_MAP_TOKEN = originalEnv;
      jest.resetAllMocks();
    });

    /**
     * @description
     * Tests API intensity retrieval and caching logic.
     */
    it('returns intensity from API and caches it', async () => {
      const mockRegion = jest.fn().mockResolvedValue('US-cache');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ carbonIntensity: 123 }),
      });

      const intensity1 = await carbon.getCarbonIntensity(mockRegion);
      expect(intensity1).toBe(123);

      // Change fetch to throw, but should use cache
      (global.fetch as jest.Mock).mockRejectedValue(new Error('fail'));
      const intensity2 = await carbon.getCarbonIntensity(mockRegion);
      expect(intensity2).toBe(123);
    });

    /**
     * @description
     * Ensures fallback value is returned on fetch error.
     */
    it('returns fallback value on fetch error', async () => {
      const mockRegion = jest.fn().mockRejectedValue(new Error('fail'));
      (global.fetch as jest.Mock).mockRejectedValue(new Error('fail'));
      const intensity = await carbon.getCarbonIntensity(mockRegion);
      expect(intensity).toBe(250);
    });

    /**
     * @description
     * Ensures fallback value is returned on non-ok response.
     */
    it('returns fallback value on non-ok response', async () => {
      const mockRegion = jest.fn().mockResolvedValue('US-fallback');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({}),
      });
      const intensity = await carbon.getCarbonIntensity(mockRegion);
      expect(intensity).toBe(250);
    });
  });

  describe('shouldUsePowerSavingMode', () => {
    it('returns true if carbonIntensity > 300', () => {
      expect(carbon.shouldUsePowerSavingMode(301)).toBe(true);
      expect(carbon.shouldUsePowerSavingMode(1000)).toBe(true);
    });
    it('returns false if carbonIntensity <= 300', () => {
      expect(carbon.shouldUsePowerSavingMode(300)).toBe(false);
      expect(carbon.shouldUsePowerSavingMode(0)).toBe(false);
    });
  });

  describe('calculatePageCarbonFootprint', () => {
    /**
     * @description
     * Verifies correct carbon emission calculation.
     */
    it('calculates correct carbon emission', () => {
      // pageWeight = 1000 KB, carbonIntensity = 500
      // energyConsumption = 1000 * 0.000002 = 0.002 kWh
      // carbonEmission = 0.002 * 500 = 1
      expect(carbon.calculatePageCarbonFootprint(1000, 500)).toBeCloseTo(1);
    });

    it('returns 0 for zero page weight', () => {
      expect(carbon.calculatePageCarbonFootprint(0, 500)).toBe(0);
    });

    it('returns 0 for zero carbon intensity', () => {
      expect(carbon.calculatePageCarbonFootprint(1000, 0)).toBe(0);
    });
  });
});

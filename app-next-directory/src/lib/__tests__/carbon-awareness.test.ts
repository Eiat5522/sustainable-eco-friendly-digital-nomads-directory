// Jest unit tests for carbon-awareness.ts

import * as carbon from '../carbon-awareness';

describe('carbon-awareness', () => {
  describe('getUserRegion', () => {
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
      const region = await (carbon as any).getUserRegion();
      expect(region).toBe('US');
    });

    it('returns UNKNOWN on fetch error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('fail'));
      const region = await (carbon as any).getUserRegion();
      expect(region).toBe('UNKNOWN');
    });
  });

  describe('getCarbonIntensity', () => {
    let originalEnv: any;
    beforeEach(() => {
      originalEnv = process.env.NEXT_PUBLIC_ELECTRICITY_MAP_TOKEN;
      process.env.NEXT_PUBLIC_ELECTRICITY_MAP_TOKEN = 'test-token';
      jest.resetModules();
      global.fetch = jest.fn();
    });

    afterEach(() => {
      process.env.NEXT_PUBLIC_ELECTRICITY_MAP_TOKEN = originalEnv;
      jest.resetAllMocks();
    });

    it('returns intensity from API and caches it', async () => {
      // Mock getUserRegion to return 'US'
      jest.spyOn(carbon as any, 'getUserRegion').mockResolvedValue('US');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ carbonIntensity: 123 }),
      });

      const intensity1 = await carbon.getCarbonIntensity();
      expect(intensity1).toBe(123);

      // Change fetch to throw, but should use cache
      (global.fetch as jest.Mock).mockRejectedValue(new Error('fail'));
      const intensity2 = await carbon.getCarbonIntensity();
      expect(intensity2).toBe(123);
    });

    it('returns fallback value on fetch error', async () => {
      jest.spyOn(carbon as any, 'getUserRegion').mockRejectedValue(new Error('fail'));
      (global.fetch as jest.Mock).mockRejectedValue(new Error('fail'));
      const intensity = await carbon.getCarbonIntensity();
      expect(intensity).toBe(250);
    });

    it('returns fallback value on non-ok response', async () => {
      jest.spyOn(carbon as any, 'getUserRegion').mockResolvedValue('US');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({}),
      });
      const intensity = await carbon.getCarbonIntensity();
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

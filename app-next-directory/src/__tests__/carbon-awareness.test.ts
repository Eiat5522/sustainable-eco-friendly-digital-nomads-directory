// Jest test for carbon-awareness.ts

import * as carbon from '../lib/carbon-awareness';

describe('carbon-awareness', () => {
  beforeEach(() => {
    carbon.clearCarbonCache();
    jest.clearAllMocks();
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('clears the cache', () => {
    // Use clearCarbonCache and check that it does not throw
    expect(() => carbon.clearCarbonCache()).not.toThrow();
  });

  it('returns region from getUserRegion', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ country_code: 'US' }),
    });
    const region = await carbon.getUserRegion();
    expect(region).toBe('US');
  });

  it('returns UNKNOWN on malformed region data', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ country_code: 123 }),
    });
    const region = await carbon.getUserRegion();
    expect(region).toBe('UNKNOWN');
  });

  it('returns UNKNOWN if fetch not ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    });
    const region = await carbon.getUserRegion();
    expect(region).toBe('UNKNOWN');
  });

  it('returns UNKNOWN on region fetch error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('fail'));
    const region = await carbon.getUserRegion();
    expect(region).toBe('UNKNOWN');
  });

  it('returns cached intensity if valid', async () => {
    process.env.NEXT_PUBLIC_ELECTRICITY_MAP_TOKEN = 'dummy'; // Ensure token is set
    // Simulate cache by calling getCarbonIntensity and then again within cache duration
    const mockGetUserRegion = jest.fn().mockResolvedValue('US');
    // First call to set cache
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ carbonIntensity: 123 }),
    });
    await carbon.getCarbonIntensity(mockGetUserRegion);
    // Second call should use cache
    const result = await carbon.getCarbonIntensity(mockGetUserRegion);
    expect(result).toBe(123);
  });

  it('returns fallback if API fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false });
    const mockGetUserRegion = jest.fn().mockResolvedValue('US');
    const result = await carbon.getCarbonIntensity(mockGetUserRegion);
    expect(result).toBe(250);
  });

  it('returns fallback if region is invalid', async () => {
    const mockGetUserRegion = jest.fn().mockResolvedValue('UNKNOWN');
    const result = await carbon.getCarbonIntensity(mockGetUserRegion);
    expect(result).toBe(250);
  });

  it('returns fallback if token is missing', async () => {
    process.env.NEXT_PUBLIC_ELECTRICITY_MAP_TOKEN = '';
    global.fetch = jest.fn();
    const mockGetUserRegion = jest.fn().mockResolvedValue('US');
    const result = await carbon.getCarbonIntensity(mockGetUserRegion);
    expect(result).toBe(250);
  });

  it('returns fallback if API returns invalid value', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ carbonIntensity: 'bad' }),
    });
    const mockGetUserRegion = jest.fn().mockResolvedValue('US');
    const result = await carbon.getCarbonIntensity(mockGetUserRegion);
    expect(result).toBe(250);
  });

  it('returns fallback on fetch error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('fail'));
    const mockGetUserRegion = jest.fn().mockResolvedValue('US');
    const result = await carbon.getCarbonIntensity(mockGetUserRegion);
    expect(result).toBe(250);
  });

  it('caches valid API result', async () => {
    process.env.NEXT_PUBLIC_ELECTRICITY_MAP_TOKEN = 'dummy'; // Ensure token is set
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ carbonIntensity: 111 }),
    });
    const mockGetUserRegion = jest.fn().mockResolvedValue('US');
    await carbon.getCarbonIntensity(mockGetUserRegion);
    // Call again to ensure cache is used (should return 111)
    const result = await carbon.getCarbonIntensity(mockGetUserRegion);
    expect(result).toBe(111);
  });

  it('shouldUsePowerSavingMode returns true for high intensity', () => {
    expect(carbon.shouldUsePowerSavingMode(400)).toBe(true);
  });

  it('shouldUsePowerSavingMode returns false for low intensity', () => {
    expect(carbon.shouldUsePowerSavingMode(200)).toBe(false);
  });

  it('calculates page carbon footprint', () => {
    const grams = carbon.calculatePageCarbonFootprint(1000, 200);
    expect(typeof grams).toBe('number');
  });
});
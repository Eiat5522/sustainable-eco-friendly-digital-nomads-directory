import bundleAnalyzer from '@next/bundle-analyzer';
import type { Mock } from 'jest-mock';

jest.mock('@next/bundle-analyzer', () => {
  const mockImplementation = jest.fn((config: unknown) => ({
    plugin: 'bundle-analyzer',
    config,
  }));

  return {
    __esModule: true,
    default: mockImplementation,
  };
});

const getMock = () => bundleAnalyzer as unknown as Mock;

describe('withBundleAnalyzer', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    getMock().mockClear();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const importPlugin = async () => {
    let plugin: unknown;
    await jest.isolateModulesAsync(async () => {
      plugin = (await import('../bundle-analyzer')).default;
    });
    return plugin;
  };

  it('disables the analyzer when environment variables are not set to true', async () => {
    delete process.env.ANALYZE;
    delete process.env.ANALYZE_OPEN;

    const plugin = await importPlugin();

    expect(getMock()).toHaveBeenCalledWith({
      enabled: false,
      openAnalyzer: false,
    });
    expect(plugin).toEqual({
      plugin: 'bundle-analyzer',
      config: {
        enabled: false,
        openAnalyzer: false,
      },
    });
  });

  it('enables the analyzer when ANALYZE and ANALYZE_OPEN are set to true', async () => {
    process.env.ANALYZE = 'true';
    process.env.ANALYZE_OPEN = 'true';

    const plugin = await importPlugin();

    expect(getMock()).toHaveBeenCalledWith({
      enabled: true,
      openAnalyzer: true,
    });
    expect(plugin).toEqual({
      plugin: 'bundle-analyzer',
      config: {
        enabled: true,
        openAnalyzer: true,
      },
    });
  });
});

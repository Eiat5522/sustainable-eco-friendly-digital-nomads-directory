import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';

// These mocks are hoisted and will apply to all imports
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

type CookiesModule = typeof import('next/headers');
type CookiesFn = CookiesModule['cookies'];
type CookiesValue = Awaited<ReturnType<CookiesFn>>;

const createCookiesStub = (theme?: string): CookiesValue =>
  ({
    get: jest.fn().mockReturnValue(theme ? { value: theme } : undefined),
  }) as unknown as CookiesValue;

jest.mock('@/utils/theme', () => ({
  __esModule: true,
  normalizeTheme: jest.fn(),
  themeClass: jest.fn(),
  THEME_INIT_SCRIPT: 'console.log("theme-init-script");',
}));

jest.mock('./ClientRootLayout', () => ({
  __esModule: true,
  default: jest.fn(({ children, theme }) => (
    <div data-testid="client-root-layout" data-theme={theme}>
      {children}
    </div>
  )),
}));

describe('RootLayout', () => {
  beforeEach(() => {
    // Clear mock history and reset module cache before each test
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should include the theme initialization script in the head', async () => {
    // Arrange
    const headersModule =
      await /* @next-codemod-error The APIs under 'next/headers' are async now, need to be manually awaited. */
      import('next/headers');
    const mockedCookies = headersModule.cookies as jest.MockedFunction<CookiesFn>;
    const { normalizeTheme, themeClass, THEME_INIT_SCRIPT } = await import('@/utils/theme');

    mockedCookies.mockResolvedValue(createCookiesStub());
    (normalizeTheme as jest.Mock).mockReturnValue('light');
    (themeClass as jest.Mock).mockReturnValue('');

    // Act
    const { default: RootLayoutComponent } = await import('./layout');
    const Layout = await RootLayoutComponent({ children: <div>Child Content</div> });
    render(Layout);

    // Assert
    const script = document.head.querySelector('script');
    expect(script).not.toBeNull();
    expect(script?.innerHTML).toBe(THEME_INIT_SCRIPT);
  });
});

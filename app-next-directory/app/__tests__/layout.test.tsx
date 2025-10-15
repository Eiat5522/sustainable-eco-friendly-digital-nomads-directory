import { describe, it, expect, jest, beforeEach, beforeAll, afterAll } from '@jest/globals';
import { render } from '@testing-library/react';
import { cookies } from 'next/headers';

// Mock ClientRootLayout
jest.mock('../ClientRootLayout', () => ({
  __esModule: true,
  default: ({ children, theme }: { children: React.ReactNode; theme?: string }) => (
    <div data-testid="client-root-layout" data-theme={theme}>
      {children}
    </div>
  ),
}));

// Import after mocks
import RootLayout, { metadata } from '../layout';

describe('RootLayout', () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeAll(() => {
    // Save original matchMedia
    originalMatchMedia = window.matchMedia;
    
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  afterAll(() => {
    // Restore original matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: originalMatchMedia,
    });
  });

  beforeEach(() => {
    (cookies as jest.Mock).mockClear();
    (cookies as jest.Mock).mockReturnValue({
      get: jest.fn(() => undefined),
    });
  });

  describe('metadata', () => {
    it('exports correct metadata', () => {
      expect(metadata).toEqual({
        title: 'SustainableNomads - Eco-Friendly Digital Nomad Directory',
        description: 'Discover sustainable coworking spaces, cafes, accommodations, and activities for conscious digital nomads worldwide.',
      });
    });
  });

  describe('RootLayout component', () => {
    it('renders with default system theme when no cookie is set', async () => {
      (cookies as jest.Mock).mockReturnValue({
        get: jest.fn(() => undefined),
      });

      const { container, findByTestId } = render(
        await RootLayout({ children: <div>Test Content</div> })
      );

      const clientLayout = await findByTestId('client-root-layout');
      expect(clientLayout).toHaveAttribute('data-theme', 'system');
      expect(container.querySelector('html')).toHaveAttribute('lang', 'en');
    });

    it('renders with light theme from cookie', async () => {
      (cookies as jest.Mock).mockReturnValue({
        get: jest.fn(() => ({ value: 'light' })),
      });

      const { findByTestId } = render(
        await RootLayout({ children: <div>Test Content</div> })
      );

      const clientLayout = await findByTestId('client-root-layout');
      expect(clientLayout).toHaveAttribute('data-theme', 'light');
    });

    it('renders with dark theme from cookie', async () => {
      (cookies as jest.Mock).mockReturnValue({
        get: jest.fn(() => ({ value: 'dark' })),
      });

      const { findByTestId } = render(
        await RootLayout({ children: <div>Test Content</div> })
      );

      const clientLayout = await findByTestId('client-root-layout');
      expect(clientLayout).toHaveAttribute('data-theme', 'dark');
    });

    it('sanitizes invalid theme cookie to system', async () => {
      (cookies as jest.Mock).mockReturnValue({
        get: jest.fn(() => ({ value: 'invalid-theme' })),
      });

      const { findByTestId } = render(
        await RootLayout({ children: <div>Test Content</div> })
      );

      const clientLayout = await findByTestId('client-root-layout');
      expect(clientLayout).toHaveAttribute('data-theme', 'system');
    });

    it('sanitizes theme cookie with extra whitespace', async () => {
      (cookies as jest.Mock).mockReturnValue({
        get: jest.fn(() => ({ value: '  DARK  ' })),
      });

      const { findByTestId } = render(
        await RootLayout({ children: <div>Test Content</div> })
      );

      const clientLayout = await findByTestId('client-root-layout');
      expect(clientLayout).toHaveAttribute('data-theme', 'dark');
    });

    it('includes theme initialization script', async () => {
      (cookies as jest.Mock).mockReturnValue({
        get: jest.fn(() => undefined),
      });

      const { container } = render(
        await RootLayout({ children: <div>Test Content</div> })
      );

      const script = container.querySelector('script');
      expect(script).toBeTruthy();
      expect(script?.innerHTML).toContain('document.documentElement');
      expect(script?.innerHTML).toContain('prefers-color-scheme');
    });

    it('applies suppressHydrationWarning to html element', async () => {
      (cookies as jest.Mock).mockReturnValue({
        get: jest.fn(() => undefined),
      });

      const { container } = render(
        await RootLayout({ children: <div>Test Content</div> })
      );

      const html = container.querySelector('html');
      expect(html).toHaveAttribute('suppressHydrationWarning');
    });

    it('applies theme class to html element for non-system themes', async () => {
      (cookies as jest.Mock).mockReturnValue({
        get: jest.fn(() => ({ value: 'dark' })),
      });

      const { container } = render(
        await RootLayout({ children: <div>Test Content</div> })
      );

      const html = container.querySelector('html');
      expect(html).toHaveClass('dark');
    });

    it('does not apply theme class to html element for system theme', async () => {
      (cookies as jest.Mock).mockReturnValue({
        get: jest.fn(() => ({ value: 'system' })),
      });

      const { container } = render(
        await RootLayout({ children: <div>Test Content</div> })
      );

      const html = container.querySelector('html');
      expect(html).not.toHaveClass('dark');
      expect(html).not.toHaveClass('light');
    });
  });
});

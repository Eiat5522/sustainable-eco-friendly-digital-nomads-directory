import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock('./ClientRootLayout', () => ({
  __esModule: true,
  default: jest.fn(({ children }) => <div data-testid="client-root-layout">{children}</div>),
}));

describe('RootLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should render with children', async () => {
    const { default: RootLayoutComponent } = await import('./layout');
    const Layout = await RootLayoutComponent({ children: <div>Child Content</div> });
    render(Layout);

    expect(screen.getByTestId('client-root-layout')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });
});

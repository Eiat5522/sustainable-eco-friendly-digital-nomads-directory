import '@testing-library/jest-dom';
import React from 'react';
import { render } from '@testing-library/react';
import ClientRootLayout from '../ClientRootLayout';

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="session-provider">{children}</div>,
}));

// Mock next-themes
jest.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="theme-provider">{children}</div>,
}));

// Mock AnalyticsProvider
jest.mock('@/components/AnalyticsProvider', () => ({
  AnalyticsProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="analytics-provider">{children}</div>,
}));

describe('ClientRootLayout', () => {
  it('renders children within provider hierarchy', () => {
    const { getByText, getByTestId } = render(
      <ClientRootLayout>
        <div>Test Content</div>
      </ClientRootLayout>
    );

    expect(getByText('Test Content')).toBeInTheDocument();
    expect(getByTestId('session-provider')).toBeInTheDocument();
    expect(getByTestId('analytics-provider')).toBeInTheDocument();
    expect(getByTestId('theme-provider')).toBeInTheDocument();
  });

  it('renders with light theme', () => {
    const { getByText } = render(
      <ClientRootLayout theme="light">
        <div>Test Content</div>
      </ClientRootLayout>
    );

    expect(getByText('Test Content')).toBeInTheDocument();
  });

  it('renders with dark theme', () => {
    const { getByText } = render(
      <ClientRootLayout theme="dark">
        <div>Test Content</div>
      </ClientRootLayout>
    );

    expect(getByText('Test Content')).toBeInTheDocument();
  });

  it('renders with system theme (default)', () => {
    const { getByText } = render(
      <ClientRootLayout theme="system">
        <div>Test Content</div>
      </ClientRootLayout>
    );

    expect(getByText('Test Content')).toBeInTheDocument();
  });

  it('renders without explicit theme prop', () => {
    const { getByText } = render(
      <ClientRootLayout>
        <div>Test Content</div>
      </ClientRootLayout>
    );

    expect(getByText('Test Content')).toBeInTheDocument();
  });
});

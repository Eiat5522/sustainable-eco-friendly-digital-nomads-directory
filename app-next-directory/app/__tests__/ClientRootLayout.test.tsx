import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import type React from 'react';
import ClientRootLayout from '../ClientRootLayout';

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="session-provider">{children}</div>
  ),
}));

describe('ClientRootLayout', () => {
  it('renders children within provider hierarchy', () => {
    const { getByText, getByTestId, queryByTestId } = render(
      <ClientRootLayout>
        <div>Test Content</div>
      </ClientRootLayout>
    );

    expect(getByText('Test Content')).toBeInTheDocument();
    expect(getByTestId('session-provider')).toBeInTheDocument();
    expect(queryByTestId('analytics-provider')).not.toBeInTheDocument();
  });
});

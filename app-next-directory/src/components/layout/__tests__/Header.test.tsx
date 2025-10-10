import { jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import * as nextAuth from 'next-auth/react';

// Mock next/image used inside Header - strip props that aren't valid DOM attributes (like priority)
await jest.unstable_mockModule('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { priority, ...rest } = props;
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...rest} />;
  },
}));
import userEvent from '@testing-library/user-event'

const { Header } = await import('../Header');

describe('Header', () => {
  const useSessionSpy = jest.spyOn(nextAuth, 'useSession')

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('shows Dashboard link for authenticated venueOwner in the account menu', async () => {
    useSessionSpy.mockReturnValue({
      data: {
        user: {
          id: '123',
          name: 'Venue Owner',
          email: 'venueowner@example.com',
          role: 'venueOwner'
        }
      },
      status: 'authenticated'
    } as any)

  const { container } = render(<Header />)

    // Open the account menu (Radix menu content is hidden by default)
    const trigger = screen.getByRole('button', { name: /open account menu/i })
    const user = userEvent.setup()
    await user.click(trigger)

    // Now the Dashboard link should be present in the DOM (may be rendered with aria-hidden by Radix in tests)
    const link = container.querySelector('a[href="/dashboard"]')
    expect(link).toBeTruthy()
  })
})

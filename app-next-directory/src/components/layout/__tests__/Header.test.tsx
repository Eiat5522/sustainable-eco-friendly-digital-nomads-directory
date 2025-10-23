import React from 'react'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Header } from '../Header'
import { useSession, signOut } from 'next-auth/react'

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { priority, ...rest } = props
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...rest} />
  },
}))

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  ...jest.requireActual('next-auth/react'),
  useSession: jest.fn(),
  signOut: jest.fn(),
}))

describe('Header', () => {
  const mockedUseSession = useSession as jest.Mock
  const mockedSignOut = signOut as jest.Mock

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders the sign-in shortcut when unauthenticated', () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })
    render(<Header />)
    expect(
      screen.getByRole('link', { name: /sign in to your account/i })
    ).toBeInTheDocument()
  })

  it('shows Dashboard link for authenticated members in the account menu', async () => {
    mockedUseSession.mockReturnValue({
      data: {
        user: {
          id: '123',
          name: 'Venue Owner',
          email: 'venueowner@example.com',
          role: 'venueOwner',
        },
      },
      status: 'authenticated',
    })
    render(<Header />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /open account menu/i }))
    await waitFor(() => {
      const dashboardLink = document.querySelector('a[href="/dashboard"]')
      expect(dashboardLink).toBeTruthy()
    })
  })

  it('reveals admin dashboards link for admin users', async () => {
    mockedUseSession.mockReturnValue({
      data: {
        user: {
          id: 'admin-1',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin',
        },
      },
      status: 'authenticated',
    })
    render(<Header />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /open account menu/i }))
    await waitFor(() => {
      const adminLink = document.querySelector('a[href="/admin/dashboard"]')
      expect(adminLink).toBeTruthy()
    })
  })

  it('invokes signOut and shows transient feedback when selecting sign out', async () => {
    mockedUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-1',
          name: 'Sign Out Tester',
          email: 'tester@example.com',
          role: 'member',
        },
      },
      status: 'authenticated',
    })
    let resolveSignOut: (() => void) | undefined
    mockedSignOut.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSignOut = resolve
        })
    )
    render(<Header />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /open account menu/i }))
    const signOutItem = await screen.findByText(/^sign out$/i)
    await user.click(signOutItem)
    expect(mockedSignOut).toHaveBeenCalledWith({ redirectTo: '/' })
    expect(await screen.findByText(/signing out/i)).toBeInTheDocument()
    await act(async () => {
      resolveSignOut?.()
    })
    expect(await screen.findByText(/^sign out$/i)).toBeInTheDocument()
  })

  it('handles signOut failure', async () => {
    mockedUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-1',
          name: 'Sign Out Tester',
          email: 'tester@example.com',
          role: 'member',
        },
      },
      status: 'authenticated',
    })
    const error = new Error('Sign out failed')
    mockedSignOut.mockRejectedValue(error)
    render(<Header />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /open account menu/i }))
    const signOutItem = await screen.findByText(/^sign out$/i)
    await user.click(signOutItem)
    expect(mockedSignOut).toHaveBeenCalledWith({ redirectTo: '/' })
    expect(await screen.findByText(/^sign out$/i)).toBeInTheDocument()
  })

  it('shows a welcome message with the user name', () => {
    mockedUseSession.mockReturnValue({
      data: {
        user: { name: 'John Doe' },
      },
      status: 'authenticated',
    })
    render(<Header />)
    expect(screen.getByText('Welcome, John!')).toBeInTheDocument()
  })

  it('displays user initials when no image is available', () => {
    mockedUseSession.mockReturnValue({
      data: {
        user: { name: 'Jane Doe', email: 'jane.doe@example.com' },
      },
      status: 'authenticated',
    })
    render(<Header />)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('renders the mobile menu button', () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })
    render(<Header />)
    expect(
      screen.getByRole('button', { name: /open navigation menu/i })
    ).toBeInTheDocument()
  })
})

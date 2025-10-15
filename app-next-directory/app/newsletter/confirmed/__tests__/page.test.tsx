import '@testing-library/jest-dom'
import React from 'react'
import { render, screen } from '@testing-library/react'

const mockUseSearchParams = jest.fn<URLSearchParams, []>()

jest.mock('next/navigation', () => ({
  __esModule: true,
  useSearchParams: () => mockUseSearchParams(),
}))

import '../../test-utils/setupMocks'
let NewsletterConfirmedPage: React.ComponentType

beforeAll(async () => {
  const pageModule = await import('../page')
  NewsletterConfirmedPage = pageModule.default
})

describe('NewsletterConfirmedPage', () => {
  beforeEach(() => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams())
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('shows the success message when no status is provided', () => {
    render(<NewsletterConfirmedPage />)

    expect(screen.getByRole('heading', { name: 'Subscription Confirmed' })).toBeInTheDocument()
    expect(
      screen.getByText('Thanks for confirming your subscription. You will start receiving updates soon.'),
    ).toBeInTheDocument()

    expect(screen.getByRole('link', { name: 'Go Home' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Subscribe Again' })).toHaveAttribute(
      'href',
      '/contact-us?type=newsletter',
    )
  })

  it('shows the invalid token message when status=invalid', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('status=invalid'))

    render(<NewsletterConfirmedPage />)

    expect(screen.getByRole('heading', { name: 'Invalid or Expired Link' })).toBeInTheDocument()
    expect(
      screen.getByText('The confirmation link is invalid or has expired. Please try subscribing again.'),
    ).toBeInTheDocument()
  })

  it('shows the missing token message when status=missing', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('status=missing'))

    render(<NewsletterConfirmedPage />)

    expect(screen.getByRole('heading', { name: 'Missing Token' })).toBeInTheDocument()
    expect(
      screen.getByText('No confirmation token was provided. Please try the link from your email again.'),
    ).toBeInTheDocument()
  })
})

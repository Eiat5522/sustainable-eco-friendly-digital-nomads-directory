import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Footer } from '../Footer'
import { useRouter } from 'next/navigation'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

describe('Footer', () => {
  const pushMock = jest.fn()

  beforeEach(() => {
    jest.resetAllMocks()
    pushMock.mockReset()
    mockUseRouter.mockReturnValue({ push: pushMock } as any)
  })

  it('renders newsletter, quick links, and contact info', () => {
    render(<Footer />)

    expect(
      screen.getByRole('heading', { name: /stay updated on sustainable travel/i })
    ).toBeInTheDocument()

    footerLinks().forEach((linkText) => {
      expect(screen.getByRole('link', { name: linkText })).toBeInTheDocument()
    })

    const currentYear = new Date().getFullYear().toString()
    expect(screen.getByText((content) => content.includes(`© ${currentYear} SustainableNomads`))).toBeTruthy()
  })

  it('shows validation feedback when subscribing with an invalid email', async () => {
    render(<Footer />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/email address/i), 'not-an-email')
    await user.click(screen.getByRole('link', { name: /subscribe/i }))

    expect(pushMock).not.toHaveBeenCalled()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Please enter a valid email address.'
    )
  })

  it('passes the email to the contact route when a valid address is provided', async () => {
    render(<Footer />)
    const user = userEvent.setup()

    const emailField = screen.getByLabelText(/email address/i)
    await user.type(emailField, 'eco.nomad@example.com')
    await user.click(screen.getByRole('link', { name: /subscribe/i }))

    expect(pushMock).toHaveBeenCalledWith(
      '/contact-us?type=newsletter&email=eco.nomad%40example.com'
    )
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

const footerLinks = () => [
  'Home',
  'Find Listings',
  'Blog',
  'Submit Your Business',
  'Login / Register',
  'Co-working Spaces',
  'Cafes',
  'Restaurants',
  'Accommodation',
  'Activities',
  'Send us a message'
]

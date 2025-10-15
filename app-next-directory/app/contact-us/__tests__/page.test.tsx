import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const mockUseSearchParams = jest.fn<URLSearchParams, []>()

jest.mock('next/navigation', () => ({
  __esModule: true,
  useSearchParams: () => mockUseSearchParams(),
}))

jest.mock('@/components/layout/Header', () => ({
  __esModule: true,
  Header: () => <header data-testid="header" />,
}))

jest.mock('@/components/layout/Footer', () => ({
  __esModule: true,
  Footer: () => <footer data-testid="footer" />,
}))

jest.mock('@/components/ui/neo-card', () => ({
  __esModule: true,
  NeoCard: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props} data-testid="neo-card">
      {children}
    </div>
  ),
}))

jest.mock('@/components/ui/neo-button', () => ({
  __esModule: true,
  NeoButton: ({ children, asChild, ...props }: any) =>
    asChild ? <span {...props}>{children}</span> : <button {...props}>{children}</button>,
}))

jest.mock('@/components/ui/select', () => {
  const React = require('react') as typeof import('react')

  const Select = ({ value, onValueChange, children }: any) => (
    <select
      data-testid="enquiry-type-select"
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
    >
      {children}
    </select>
  )

  const SelectTrigger = ({ children }: any) => <>{children}</>
  const SelectContent = ({ children }: any) => <>{children}</>
  const SelectValue = () => null
  const SelectItem = ({ value, children }: any) => (
    <option value={value}>{children}</option>
  )

  return {
    __esModule: true,
    Select,
    SelectTrigger,
    SelectContent,
    SelectValue,
    SelectItem,
  }
})

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

jest.mock('lucide-react', () => ({
  Mail: (props: any) => <svg {...props} data-testid="icon-mail" />,
  MessageSquare: (props: any) => <svg {...props} data-testid="icon-message" />,
  Type: (props: any) => <svg {...props} data-testid="icon-type" />,
}))

let ContactUsPage: React.ComponentType

beforeAll(async () => {
  const pageModule = await import('../page')
  ContactUsPage = pageModule.default
})

const originalFetch = global.fetch

describe('ContactUsPage', () => {
  beforeEach(() => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams())
    sessionStorage.clear()
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => {
    global.fetch = originalFetch
  })

  it('shows validation errors for a general enquiry when form is submitted empty', async () => {
    render(<ContactUsPage />)

    fireEvent.click(screen.getByTestId('contact-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('name-error')).toHaveTextContent('Name must be at least 2 characters')
      expect(screen.getByTestId('email-error')).toHaveTextContent('Please enter a valid email address')
      expect(screen.getByTestId('subject-error')).toHaveTextContent('Subject must be at least 5 characters')
      expect(screen.getByTestId('message-error')).toHaveTextContent('Message must be at least 10 characters')
    })

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('prefills newsletter email from session storage and validates newsletter schema', async () => {
    sessionStorage.setItem('newsletterEmail', 'stored@example.com')
    mockUseSearchParams.mockReturnValue(new URLSearchParams('type=newsletter'))

    render(<ContactUsPage />)

    const emailInput = await screen.findByTestId('contact-email')
    expect((emailInput as HTMLInputElement).value).toBe('stored@example.com')

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.click(screen.getByTestId('contact-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('email-error')).toHaveTextContent('Please enter a valid email address')
    })

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('submits a general enquiry successfully', async () => {
    const fetchMock = global.fetch as jest.Mock
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Thanks for reaching out!' }),
    })

    render(<ContactUsPage />)

    fireEvent.change(screen.getByTestId('contact-name'), { target: { value: 'Jane Doe' } })
    fireEvent.change(screen.getByTestId('contact-email'), { target: { value: 'jane@example.com' } })
    fireEvent.change(screen.getByTestId('contact-subject'), { target: { value: 'Question about listings' } })
    fireEvent.change(screen.getByTestId('contact-message'), { target: { value: 'Could you tell me more about eco stays?' } })

    fireEvent.click(screen.getByTestId('contact-submit'))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/contact',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    })

    const body = JSON.parse(fetchMock.mock.calls[0][1]?.body ?? '{}')
    expect(body).toEqual({
      name: 'Jane Doe',
      email: 'jane@example.com',
      subject: 'Question about listings',
      message: 'Could you tell me more about eco stays?',
      type: 'general',
    })

    await waitFor(() => {
      expect(screen.getByTestId('contact-success')).toHaveTextContent('Thanks for reaching out!')
    })

    expect((screen.getByTestId('contact-name') as HTMLInputElement).value).toBe('')
    expect((screen.getByTestId('contact-subject') as HTMLInputElement).value).toBe('')
    expect((screen.getByTestId('contact-message') as HTMLTextAreaElement).value).toBe('')
  })

  it('shows an error when newsletter subscription fails', async () => {
    const fetchMock = global.fetch as jest.Mock
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Already subscribed' }),
    })

    mockUseSearchParams.mockReturnValue(new URLSearchParams('type=newsletter'))

    render(<ContactUsPage />)

    const emailInput = await screen.findByTestId('contact-email')
    fireEvent.change(emailInput, { target: { value: 'reader@example.com' } })

    fireEvent.click(screen.getByTestId('contact-submit'))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/newsletter/subscribe',
        expect.objectContaining({ method: 'POST' }),
      )
    })

    await waitFor(() => {
      expect(screen.getByTestId('contact-error')).toHaveTextContent('Already subscribed')
    })
  })
})

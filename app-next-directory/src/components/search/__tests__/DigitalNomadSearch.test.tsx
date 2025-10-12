/**
 * @jest-environment jsdom
 * Unit tests for DigitalNomadSearch component
 * 
 * Component: DigitalNomadSearch - Core search component for digital nomad listings
 * Priority: CRITICAL - Main search functionality with URL param synchronization
 * Coverage Target: 85%+
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DigitalNomadSearch } from '../DigitalNomadSearch'
import { useRouter, useSearchParams } from 'next/navigation'

// Mock Next.js navigation hooks
const mockPush = jest.fn()
const mockSearchParams = new URLSearchParams()

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

// Mock UI components
jest.mock('@/components/ui/neo-input', () => ({
  NeoInput: jest.fn(({ value, onChange, placeholder, ...props }) => (
    <input
      data-testid="neo-input"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      {...props}
    />
  )),
}))

jest.mock('@/components/ui/neo-button', () => ({
  NeoButton: jest.fn(({ children, type, variant, ...props }) => (
    <button data-testid="neo-button" type={type} data-variant={variant} {...props}>
      {children}
    </button>
  )),
}))

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>

describe('DigitalNomadSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSearchParams.get = jest.fn(() => null)
    mockSearchParams.entries = jest.fn(() => [][Symbol.iterator]())
    mockSearchParams.toString = jest.fn(() => '')
    
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    } as any)
    
    mockUseSearchParams.mockReturnValue(mockSearchParams as any)
  })

  describe('Rendering', () => {
    it('should render search form with input and button', () => {
      render(<DigitalNomadSearch />)
      
      expect(screen.getByRole('search')).toBeInTheDocument()
      expect(screen.getByTestId('neo-input')).toBeInTheDocument()
      expect(screen.getByTestId('neo-button')).toBeInTheDocument()
    })

    it('should render with default placeholder', () => {
      render(<DigitalNomadSearch />)
      
      const input = screen.getByTestId('neo-input')
      expect(input).toHaveAttribute('placeholder', 'Search listings...')
    })

    it('should render with custom placeholder', () => {
      const customPlaceholder = 'Find eco-friendly venues'
      render(<DigitalNomadSearch placeholder={customPlaceholder} />)
      
      const input = screen.getByTestId('neo-input')
      expect(input).toHaveAttribute('placeholder', customPlaceholder)
    })

    it('should have proper ARIA labels', () => {
      render(<DigitalNomadSearch />)
      
      expect(screen.getByRole('search')).toHaveAttribute('aria-label', 'Search listings')
      expect(screen.getByTestId('neo-input')).toHaveAttribute('aria-label', 'Search query')
    })

    it('should have correct input name attribute', () => {
      render(<DigitalNomadSearch />)
      
      const input = screen.getByTestId('neo-input')
      expect(input).toHaveAttribute('name', 'q')
    })

    it('should render submit button with primary variant', () => {
      render(<DigitalNomadSearch />)
      
      const button = screen.getByTestId('neo-button')
      expect(button).toHaveAttribute('type', 'submit')
      expect(button).toHaveAttribute('data-variant', 'primary')
      expect(button).toHaveTextContent('Search')
    })
  })

  describe('URL Parameter Synchronization', () => {
    it('should initialize with empty value when no query param', () => {
      mockSearchParams.get = jest.fn(() => null)
      render(<DigitalNomadSearch />)
      
      const input = screen.getByTestId('neo-input') as HTMLInputElement
      expect(input.value).toBe('')
    })

    it('should initialize with query param value', () => {
      mockSearchParams.get = jest.fn((key) => key === 'q' ? 'eco coworking' : null)
      render(<DigitalNomadSearch />)
      
      const input = screen.getByTestId('neo-input') as HTMLInputElement
      expect(input.value).toBe('eco coworking')
    })

    it('should update when search params change', () => {
      const { rerender } = render(<DigitalNomadSearch />)
      
      // Change search params
      mockSearchParams.get = jest.fn((key) => key === 'q' ? 'new search' : null)
      rerender(<DigitalNomadSearch />)
      
      waitFor(() => {
        const input = screen.getByTestId('neo-input') as HTMLInputElement
        expect(input.value).toBe('new search')
      })
    })

    it('should handle empty string query param', () => {
      mockSearchParams.get = jest.fn((key) => key === 'q' ? '' : null)
      render(<DigitalNomadSearch />)
      
      const input = screen.getByTestId('neo-input') as HTMLInputElement
      expect(input.value).toBe('')
    })
  })

  describe('User Interactions', () => {
    it('should update input value on typing', async () => {
      const user = userEvent.setup()
      render(<DigitalNomadSearch />)
      
      const input = screen.getByTestId('neo-input')
      await user.type(input, 'coworking space')
      
      expect(input).toHaveValue('coworking space')
    })

    it('should handle form submission', async () => {
      const user = userEvent.setup()
      render(<DigitalNomadSearch />)
      
      const input = screen.getByTestId('neo-input')
      await user.type(input, 'test query')
      
      const form = screen.getByRole('search')
      await user.click(screen.getByTestId('neo-button'))
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('/search')
        )
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('q=test+query')
        )
      })
    })

    it('should submit on Enter key press', async () => {
      const user = userEvent.setup()
      render(<DigitalNomadSearch />)
      
      const input = screen.getByTestId('neo-input')
      await user.type(input, 'search term{Enter}')
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled()
      })
    })

    it('should call onSearch callback if provided', async () => {
      const user = userEvent.setup()
      const onSearch = jest.fn()
      render(<DigitalNomadSearch onSearch={onSearch} />)
      
      const input = screen.getByTestId('neo-input')
      await user.type(input, 'callback test')
      await user.click(screen.getByTestId('neo-button'))
      
      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('callback test')
      })
    })

    it('should not call onSearch if not provided', async () => {
      const user = userEvent.setup()
      render(<DigitalNomadSearch />)
      
      const input = screen.getByTestId('neo-input')
      await user.type(input, 'no callback')
      await user.click(screen.getByTestId('neo-button'))
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled()
      })
    })
  })

  describe('Query Parameter Management', () => {
    it('should add query param when searching', async () => {
      const user = userEvent.setup()
      mockSearchParams.entries = jest.fn(() => [][Symbol.iterator]())
      
      render(<DigitalNomadSearch />)
      
      const input = screen.getByTestId('neo-input')
      await user.type(input, 'new search')
      await user.click(screen.getByTestId('neo-button'))
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/search?q=new+search')
      })
    })

    it('should delete query param when searching with empty value', async () => {
      const user = userEvent.setup()
      mockSearchParams.entries = jest.fn(() => [][Symbol.iterator]())
      mockSearchParams.get = jest.fn(() => 'existing')
      
      render(<DigitalNomadSearch />)
      
      const input = screen.getByTestId('neo-input')
      await user.clear(input)
      await user.click(screen.getByTestId('neo-button'))
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/search?')
      })
    })

    it('should preserve other query params', async () => {
      const user = userEvent.setup()
      const existingParams = new Map([['category', 'coworking'], ['page', '2']])
      mockSearchParams.entries = jest.fn(() => existingParams.entries())
      mockSearchParams.get = jest.fn((key) => existingParams.get(key) || null)
      
      render(<DigitalNomadSearch />)
      
      const input = screen.getByTestId('neo-input')
      await user.type(input, 'search')
      await user.click(screen.getByTestId('neo-button'))
      
      await waitFor(() => {
        const callArg = mockPush.mock.calls[0][0]
        expect(callArg).toContain('q=search')
        expect(callArg).toContain('category=coworking')
      })
    })

    it('should delete page param when searching', async () => {
      const user = userEvent.setup()
      const existingParams = new Map([['page', '3']])
      mockSearchParams.entries = jest.fn(() => existingParams.entries())
      
      render(<DigitalNomadSearch />)
      
      const input = screen.getByTestId('neo-input')
      await user.type(input, 'reset page')
      await user.click(screen.getByTestId('neo-button'))
      
      await waitFor(() => {
        const callArg = mockPush.mock.calls[0][0]
        expect(callArg).not.toContain('page=')
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle special characters in search query', async () => {
      const user = userEvent.setup()
      render(<DigitalNomadSearch />)
      
      const input = screen.getByTestId('neo-input')
      await user.type(input, 'café & coworking!')
      await user.click(screen.getByTestId('neo-button'))
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled()
      })
    })

    it('should handle very long search queries', async () => {
      const user = userEvent.setup()
      const longQuery = 'a'.repeat(1000)
      render(<DigitalNomadSearch />)
      
      const input = screen.getByTestId('neo-input')
      await user.type(input, longQuery)
      await user.click(screen.getByTestId('neo-button'))
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled()
      })
    })

    it('should handle whitespace-only input', async () => {
      const user = userEvent.setup()
      render(<DigitalNomadSearch />)
      
      const input = screen.getByTestId('neo-input')
      await user.type(input, '   ')
      await user.click(screen.getByTestId('neo-button'))
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/search?q=+++')
      })
    })

    it('should handle rapid form submissions', async () => {
      const user = userEvent.setup()
      render(<DigitalNomadSearch />)
      
      const input = screen.getByTestId('neo-input')
      await user.type(input, 'test')
      
      // Submit multiple times
      await user.click(screen.getByTestId('neo-button'))
      await user.click(screen.getByTestId('neo-button'))
      await user.click(screen.getByTestId('neo-button'))
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled()
      })
    })
  })

  describe('Component Styling', () => {
    it('should apply flex gap layout to form', () => {
      render(<DigitalNomadSearch />)
      
      const form = screen.getByRole('search')
      expect(form).toHaveClass('flex', 'gap-3', 'w-full')
    })
  })

  describe('Default Export', () => {
    it('should be importable as default export', async () => {
      const DigitalNomadSearchDefault = (await import('../DigitalNomadSearch')).default
      render(<DigitalNomadSearchDefault />)
      
      expect(screen.getByRole('search')).toBeInTheDocument()
    })
  })
})

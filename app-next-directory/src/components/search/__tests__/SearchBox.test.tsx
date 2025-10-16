/** @jest-environment jsdom */
/**
 * Unit tests for SearchBox component
 * 
 * Component: SearchBox - A wrapper component that renders DigitalNomadSearch in a NeoCard
 * Priority: CRITICAL - Primary search input component used throughout the application
 * Coverage Target: 85%+
 */

import { render, screen } from '@testing-library/react'
import { SearchBox } from '../SearchBox'

// Mock the child components
jest.mock('../DigitalNomadSearch', () => ({
  DigitalNomadSearch: jest.fn(({ placeholder = 'Search listings...' }) => (
    <div data-testid="digital-nomad-search">
      <input placeholder={placeholder} aria-label="Search query" />
    </div>
  )),
}))

jest.mock('@/components/ui/neo-card', () => ({
  NeoCard: jest.fn(({ children, variant, className }) => (
    <div data-testid="neo-card" data-variant={variant} className={className}>
      {children}
    </div>
  )),
}))

describe('SearchBox', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<SearchBox />)
      expect(screen.getByTestId('neo-card')).toBeInTheDocument()
      expect(screen.getByTestId('digital-nomad-search')).toBeInTheDocument()
    })

    it('should render with default placeholder', () => {
      render(<SearchBox />)
      const input = screen.getByLabelText('Search query')
      expect(input).toHaveAttribute('placeholder', 'Search listings...')
    })

    it('should pass custom placeholder to DigitalNomadSearch', () => {
      const placeholder = 'Find sustainable venues...'
      render(<SearchBox placeholder={placeholder} />)
      const input = screen.getByLabelText('Search query')
      expect(input).toHaveAttribute('placeholder', placeholder)
    })
  })

  describe('Component Structure', () => {
    it('should wrap DigitalNomadSearch in a NeoCard', () => {
      render(<SearchBox />)
      const card = screen.getByTestId('neo-card')
      const search = screen.getByTestId('digital-nomad-search')
      expect(card).toContainElement(search)
    })

    it('should apply flat variant to NeoCard', () => {
      render(<SearchBox />)
      const card = screen.getByTestId('neo-card')
      expect(card).toHaveAttribute('data-variant', 'flat')
    })

    it('should apply mb-6 className to NeoCard', () => {
      render(<SearchBox />)
      const card = screen.getByTestId('neo-card')
      expect(card).toHaveClass('mb-6')
    })

    it('should render DigitalNomadSearch in a padding container', () => {
      const { container } = render(<SearchBox />)
      const paddingDiv = container.querySelector('.p-4')
      expect(paddingDiv).toBeInTheDocument()
      expect(paddingDiv).toContainElement(screen.getByTestId('digital-nomad-search'))
    })
  })

  describe('Props Handling', () => {
    it('should handle undefined placeholder prop', () => {
      render(<SearchBox placeholder={undefined} />)
      expect(screen.getByTestId('digital-nomad-search')).toBeInTheDocument()
    })

    it('should handle empty string placeholder', () => {
      render(<SearchBox placeholder="" />)
      const input = screen.getByLabelText('Search query')
      expect(input).toHaveAttribute('placeholder', '')
    })

    it('should handle long placeholder text', () => {
      const longPlaceholder = 'Search for eco-friendly coworking spaces, cafés, and sustainable venues in your favorite digital nomad destinations'
      render(<SearchBox placeholder={longPlaceholder} />)
      const input = screen.getByLabelText('Search query')
      expect(input).toHaveAttribute('placeholder', longPlaceholder)
    })

    it('should handle placeholder with special characters', () => {
      const specialPlaceholder = 'Search: café, coworking & more...'
      render(<SearchBox placeholder={specialPlaceholder} />)
      const input = screen.getByLabelText('Search query')
      expect(input).toHaveAttribute('placeholder', specialPlaceholder)
    })
  })

  describe('Component Integration', () => {
    it('should maintain component hierarchy', () => {
      const { container } = render(<SearchBox placeholder="Test" />)
      
      // Verify the structure: NeoCard > div.p-4 > DigitalNomadSearch
      const card = screen.getByTestId('neo-card')
      expect(card).toBeInTheDocument()
      
      const paddingContainer = container.querySelector('.p-4')
      expect(paddingContainer).toBeInTheDocument()
      expect(card).toContainElement(paddingContainer!)
      
      const search = screen.getByTestId('digital-nomad-search')
      expect(paddingContainer).toContainElement(search)
    })
  })

  describe('Edge Cases', () => {
    it('should render consistently on multiple renders', () => {
      const { rerender } = render(<SearchBox placeholder="First" />)
      expect(screen.getByLabelText('Search query')).toHaveAttribute('placeholder', 'First')
      
      rerender(<SearchBox placeholder="Second" />)
      expect(screen.getByLabelText('Search query')).toHaveAttribute('placeholder', 'Second')
    })

    it('should maintain structure when placeholder changes', () => {
      const { rerender } = render(<SearchBox placeholder="Initial" />)
      const initialCard = screen.getByTestId('neo-card')
      
      rerender(<SearchBox placeholder="Updated" />)
      const updatedCard = screen.getByTestId('neo-card')
      
      // Structure should remain the same
      expect(updatedCard).toBeInTheDocument()
      expect(screen.getByTestId('digital-nomad-search')).toBeInTheDocument()
    })
  })

  describe('Default Export', () => {
    it('should be importable as default export', async () => {
      const SearchBoxDefault = (await import('../SearchBox')).default
      render(<SearchBoxDefault />)
      expect(screen.getByTestId('neo-card')).toBeInTheDocument()
    })
  })
})

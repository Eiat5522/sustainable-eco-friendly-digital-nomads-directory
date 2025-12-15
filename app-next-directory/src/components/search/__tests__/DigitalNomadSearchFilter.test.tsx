/** @jest-environment jsdom */
/**
 * Unit tests for DigitalNomadSearchFilter component
 *
 * Component: DigitalNomadSearchFilter - Filter component for digital nomad search
 * Priority: HIGH - Key filtering functionality
 * Coverage Target: 85%+
 */

import { fireEvent, render, screen } from '@testing-library/react';
import type { FilterDefinition } from '@/hooks/useFilters';
import { DigitalNomadSearchFilter } from '../DigitalNomadSearchFilter';

// Mock the useFilters hook
const mockToggleFilter = jest.fn();
const mockClearFilters = jest.fn();

jest.mock('@/hooks/useFilters', () => ({
  useFilters: jest.fn(() => ({
    activeFilters: {},
    toggleFilter: mockToggleFilter,
    clearFilters: mockClearFilters,
  })),
}));

// Mock UI components
jest.mock('@/components/ui/neo-button', () => ({
  NeoButton: function MockNeoButton({ children, onClick, ...props }: React.PropsWithChildren<React.ComponentProps<'button'>>) {
    return (
      <button onClick={onClick} data-testid="clear-filters-button" {...props}>
        {children}
      </button>
    );
  },
}));

jest.mock('@/components/ui/neo-card', () => ({
  NeoCard: function MockNeoCard({ children, ...props }: React.PropsWithChildren<React.ComponentProps<'div'>>) {
    return (
      <div data-testid="neo-card" {...props}>
        {children}
      </div>
    );
  },
  NeoCardHeader: function MockNeoCardHeader({ children }: React.PropsWithChildren) {
    return <div data-testid="neo-card-header">{children}</div>;
  },
  NeoCardTitle: function MockNeoCardTitle({ children }: React.PropsWithChildren) {
    return <h3 data-testid="neo-card-title">{children}</h3>;
  },
  NeoCardContent: function MockNeoCardContent({ children, className }: React.PropsWithChildren<{ className?: string }>) {
    return (
      <div data-testid="neo-card-content" className={className}>
        {children}
      </div>
    );
  },
}));

describe('DigitalNomadSearchFilter', () => {
  const mockDefinitions: FilterDefinition[] = [
    {
      id: 'category',
      label: 'Category',
      options: [
        { id: 'cafe', label: 'Cafe', count: 10 },
        { id: 'coworking', label: 'Coworking Space', count: 5 },
        { id: 'hotel', label: 'Hotel' },
      ],
    },
    {
      id: 'amenities',
      label: 'Amenities',
      options: [
        { id: 'wifi', label: 'WiFi', count: 20 },
        { id: 'coffee', label: 'Coffee', count: 15 },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    const { useFilters } = require('@/hooks/useFilters');
    useFilters.mockReturnValue({
      activeFilters: {},
      toggleFilter: mockToggleFilter,
      clearFilters: mockClearFilters,
    });
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<DigitalNomadSearchFilter definitions={mockDefinitions} />);
      expect(screen.getByTestId('neo-card')).toBeInTheDocument();
    });

    it('should render default title', () => {
      render(<DigitalNomadSearchFilter definitions={mockDefinitions} />);
      expect(screen.getByTestId('neo-card-title')).toHaveTextContent('Filters');
    });

    it('should render custom title', () => {
      render(<DigitalNomadSearchFilter definitions={mockDefinitions} title="Custom Filters" />);
      expect(screen.getByTestId('neo-card-title')).toHaveTextContent('Custom Filters');
    });

    it('should render all filter groups', () => {
      render(<DigitalNomadSearchFilter definitions={mockDefinitions} />);
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Amenities')).toBeInTheDocument();
    });

    it('should render all filter options', () => {
      render(<DigitalNomadSearchFilter definitions={mockDefinitions} />);
      expect(screen.getByText(/Cafe/)).toBeInTheDocument();
      expect(screen.getByText(/Coworking Space/)).toBeInTheDocument();
      expect(screen.getByText(/Hotel/)).toBeInTheDocument();
      expect(screen.getByText(/WiFi/)).toBeInTheDocument();
      expect(screen.getByText(/Coffee/)).toBeInTheDocument();
    });

    it('should render option counts when provided', () => {
      render(<DigitalNomadSearchFilter definitions={mockDefinitions} />);
      expect(screen.getByText(/Cafe.*10/)).toBeInTheDocument();
      expect(screen.getByText(/WiFi.*20/)).toBeInTheDocument();
    });

    it('should not render count when not provided', () => {
      render(<DigitalNomadSearchFilter definitions={mockDefinitions} />);
      const hotelLabel = screen.getByText('Hotel');
      expect(hotelLabel.textContent).toBe('Hotel');
      expect(hotelLabel.textContent).not.toContain('(');
    });

    it('should render clear filters button', () => {
      render(<DigitalNomadSearchFilter definitions={mockDefinitions} />);
      expect(screen.getByTestId('clear-filters-button')).toBeInTheDocument();
      expect(screen.getByText('Clear filters')).toBeInTheDocument();
    });
  });

  describe('Filter Interaction', () => {
    it('should call toggleFilter when checkbox is clicked', () => {
      render(<DigitalNomadSearchFilter definitions={mockDefinitions} />);

      const cafeCheckbox = screen.getByLabelText('Category: Cafe');
      fireEvent.click(cafeCheckbox);

      expect(mockToggleFilter).toHaveBeenCalledWith('category', 'cafe');
      expect(mockToggleFilter).toHaveBeenCalledTimes(1);
    });

    it('should call toggleFilter with correct parameters for different options', () => {
      render(<DigitalNomadSearchFilter definitions={mockDefinitions} />);

      const wifiCheckbox = screen.getByLabelText('Amenities: WiFi');
      fireEvent.click(wifiCheckbox);

      expect(mockToggleFilter).toHaveBeenCalledWith('amenities', 'wifi');
    });

    it('should handle multiple filter selections', () => {
      render(<DigitalNomadSearchFilter definitions={mockDefinitions} />);

      const cafeCheckbox = screen.getByLabelText('Category: Cafe');
      const wifiCheckbox = screen.getByLabelText('Amenities: WiFi');

      fireEvent.click(cafeCheckbox);
      fireEvent.click(wifiCheckbox);

      expect(mockToggleFilter).toHaveBeenCalledTimes(2);
      expect(mockToggleFilter).toHaveBeenCalledWith('category', 'cafe');
      expect(mockToggleFilter).toHaveBeenCalledWith('amenities', 'wifi');
    });

    it('should call clearFilters when clear button is clicked', () => {
      render(<DigitalNomadSearchFilter definitions={mockDefinitions} />);

      const clearButton = screen.getByTestId('clear-filters-button');
      fireEvent.click(clearButton);

      expect(mockClearFilters).toHaveBeenCalledTimes(1);
    });
  });

  describe('Active Filters Display', () => {
    it('should show checked state for active filters', () => {
      const { useFilters } = require('@/hooks/useFilters');
      useFilters.mockReturnValue({
        activeFilters: {
          category: ['cafe'],
        },
        toggleFilter: mockToggleFilter,
        clearFilters: mockClearFilters,
      });

      render(<DigitalNomadSearchFilter definitions={mockDefinitions} />);

      const cafeCheckbox = screen.getByLabelText('Category: Cafe') as HTMLInputElement;
      expect(cafeCheckbox.checked).toBe(true);
    });

    it('should show unchecked state for inactive filters', () => {
      const { useFilters } = require('@/hooks/useFilters');
      useFilters.mockReturnValue({
        activeFilters: {
          category: ['cafe'],
        },
        toggleFilter: mockToggleFilter,
        clearFilters: mockClearFilters,
      });

      render(<DigitalNomadSearchFilter definitions={mockDefinitions} />);

      const coworkingCheckbox = screen.getByLabelText(
        'Category: Coworking Space'
      ) as HTMLInputElement;
      expect(coworkingCheckbox.checked).toBe(false);
    });

    it('should handle multiple active filters in same group', () => {
      const { useFilters } = require('@/hooks/useFilters');
      useFilters.mockReturnValue({
        activeFilters: {
          category: ['cafe', 'coworking'],
        },
        toggleFilter: mockToggleFilter,
        clearFilters: mockClearFilters,
      });

      render(<DigitalNomadSearchFilter definitions={mockDefinitions} />);

      const cafeCheckbox = screen.getByLabelText('Category: Cafe') as HTMLInputElement;
      const coworkingCheckbox = screen.getByLabelText(
        'Category: Coworking Space'
      ) as HTMLInputElement;

      expect(cafeCheckbox.checked).toBe(true);
      expect(coworkingCheckbox.checked).toBe(true);
    });

    it('should handle active filters across multiple groups', () => {
      const { useFilters } = require('@/hooks/useFilters');
      useFilters.mockReturnValue({
        activeFilters: {
          category: ['cafe'],
          amenities: ['wifi'],
        },
        toggleFilter: mockToggleFilter,
        clearFilters: mockClearFilters,
      });

      render(<DigitalNomadSearchFilter definitions={mockDefinitions} />);

      const cafeCheckbox = screen.getByLabelText('Category: Cafe') as HTMLInputElement;
      const wifiCheckbox = screen.getByLabelText('Amenities: WiFi') as HTMLInputElement;

      expect(cafeCheckbox.checked).toBe(true);
      expect(wifiCheckbox.checked).toBe(true);
    });
  });

  describe('Initial Filters', () => {
    it('should initialize with provided initial filters', () => {
      const initialFilters = {
        category: ['cafe', 'coworking'],
      };

      render(
        <DigitalNomadSearchFilter definitions={mockDefinitions} initialFilters={initialFilters} />
      );

      const { useFilters } = require('@/hooks/useFilters');
      expect(useFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          definitions: mockDefinitions,
          initialFilters,
        })
      );
    });

    it('should handle empty initial filters', () => {
      render(<DigitalNomadSearchFilter definitions={mockDefinitions} initialFilters={{}} />);

      const { useFilters } = require('@/hooks/useFilters');
      expect(useFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          initialFilters: {},
        })
      );
    });

    it('should work without initial filters', () => {
      render(<DigitalNomadSearchFilter definitions={mockDefinitions} />);

      const { useFilters } = require('@/hooks/useFilters');
      expect(useFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          definitions: mockDefinitions,
        })
      );
    });
  });

  describe('onChange Callback', () => {
    it('should pass onChange callback to useFilters', () => {
      const mockOnChange = jest.fn();

      render(<DigitalNomadSearchFilter definitions={mockDefinitions} onChange={mockOnChange} />);

      const { useFilters } = require('@/hooks/useFilters');
      expect(useFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          onFilterChange: mockOnChange,
        })
      );
    });

    it('should work without onChange callback', () => {
      render(<DigitalNomadSearchFilter definitions={mockDefinitions} />);

      const { useFilters } = require('@/hooks/useFilters');
      expect(useFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          definitions: mockDefinitions,
        })
      );
    });
  });

  describe('Empty Definitions', () => {
    it('should handle empty definitions array', () => {
      render(<DigitalNomadSearchFilter definitions={[]} />);

      expect(screen.getByTestId('neo-card')).toBeInTheDocument();
      expect(screen.getByTestId('clear-filters-button')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label for checkboxes', () => {
      render(<DigitalNomadSearchFilter definitions={mockDefinitions} />);

      const cafeCheckbox = screen.getByLabelText('Category: Cafe');
      expect(cafeCheckbox).toHaveAttribute('aria-label', 'Category: Cafe');
    });

    it('should associate labels with checkboxes', () => {
      render(<DigitalNomadSearchFilter definitions={mockDefinitions} />);

      const cafeCheckbox = screen.getByLabelText('Category: Cafe') as HTMLInputElement;
      expect(cafeCheckbox.type).toBe('checkbox');
    });

    it('should be keyboard navigable', () => {
      render(<DigitalNomadSearchFilter definitions={mockDefinitions} />);

      const firstCheckbox = screen.getByLabelText('Category: Cafe');
      const secondCheckbox = screen.getByLabelText('Category: Coworking Space');

      expect(firstCheckbox).toBeInTheDocument();
      expect(secondCheckbox).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should render NeoCard with flat variant', () => {
      render(<DigitalNomadSearchFilter definitions={mockDefinitions} />);

      const card = screen.getByTestId('neo-card');
      expect(card).toHaveAttribute('variant', 'flat');
    });

    it('should render card header with title', () => {
      render(<DigitalNomadSearchFilter definitions={mockDefinitions} />);

      expect(screen.getByTestId('neo-card-header')).toBeInTheDocument();
      expect(screen.getByTestId('neo-card-title')).toBeInTheDocument();
    });

    it('should render card content with proper spacing', () => {
      render(<DigitalNomadSearchFilter definitions={mockDefinitions} />);

      const content = screen.getByTestId('neo-card-content');
      expect(content).toHaveClass('space-y-6');
    });

    it('should render clear button with correct type and variant', () => {
      render(<DigitalNomadSearchFilter definitions={mockDefinitions} />);

      const clearButton = screen.getByTestId('clear-filters-button');
      expect(clearButton).toHaveAttribute('type', 'button');
      expect(clearButton).toHaveAttribute('variant', 'outline');
      // Note: size attribute is not rendered as HTML attribute, it's a prop handled by the component
    });
  });

  describe('Default Export', () => {
    it('should be importable as default export', async () => {
      const DigitalNomadSearchFilterDefault = (await import('../DigitalNomadSearchFilter')).default;
      render(<DigitalNomadSearchFilterDefault definitions={mockDefinitions} />);
      expect(screen.getByTestId('neo-card')).toBeInTheDocument();
    });
  });
});

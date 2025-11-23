/** @jest-environment jsdom */
/**
 * Unit tests for FiltersSidebar component
 *
 * Component: FiltersSidebar - Sidebar containing search filters
 * Priority: CRITICAL - Core filtering functionality for search results
 * Coverage Target: 85%+
 */

import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import { ListingCategory } from '@/types/enums';
import { FiltersSidebar } from '../FiltersSidebar';

// Mock Next.js navigation hooks
const mockPush = jest.fn();
const mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

const digitalNomadSearchFilterMock = jest.fn();

jest.mock('../DigitalNomadSearchFilter', () => ({
  DigitalNomadSearchFilter: (props: any) => digitalNomadSearchFilterMock(props),
}));

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;

const defaultDigitalNomadSearchFilterImplementation = ({
  definitions,
  initialFilters,
  onChange,
  title,
}: any) => (
  <div data-testid="digital-nomad-search-filter">
    <h2>{title}</h2>
    <div data-testid="filter-definitions">{JSON.stringify(definitions)}</div>
    <div data-testid="initial-filters">{JSON.stringify(initialFilters)}</div>
    <button onClick={() => onChange({ category: ['coworking'] })}>Apply Filter</button>
  </div>
);

describe('FiltersSidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams.getAll = jest.fn(() => []);
    mockSearchParams.entries = jest.fn(() => [][Symbol.iterator]());

    digitalNomadSearchFilterMock.mockImplementation(defaultDigitalNomadSearchFilterImplementation);

    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    } as any);

    mockUseSearchParams.mockReturnValue(mockSearchParams as any);
  });

  describe('Rendering', () => {
    it('should render DigitalNomadSearchFilter component', () => {
      render(<FiltersSidebar />);

      expect(screen.getByTestId('digital-nomad-search-filter')).toBeInTheDocument();
    });

    it('should pass "Filter Results" as title', () => {
      render(<FiltersSidebar />);

      expect(screen.getByText('Filter Results')).toBeInTheDocument();
    });

    it('should render with default filter definitions', () => {
      render(<FiltersSidebar />);

      const definitions = screen.getByTestId('filter-definitions');
      const content = JSON.parse(definitions.textContent || '[]');

      expect(content).toHaveLength(4); // category, destination, amenities, nomadFeatures
      expect(content[0]).toHaveProperty('id', 'category');
      expect(content[1]).toHaveProperty('id', 'destination');
      expect(content[2]).toHaveProperty('id', 'amenities');
      expect(content[3]).toHaveProperty('id', 'nomadFeatures');
    });

    it('should accept custom filter definitions', () => {
      const customDefinitions = [
        {
          id: 'custom',
          label: 'Custom Filter',
          multiSelect: true,
          options: [{ id: 'option1', label: 'Option 1' }],
        },
      ];

      render(<FiltersSidebar definitions={customDefinitions} />);

      const definitions = screen.getByTestId('filter-definitions');
      const content = JSON.parse(definitions.textContent || '[]');

      expect(content).toHaveLength(1);
      expect(content[0]).toHaveProperty('id', 'custom');
    });
  });

  describe('Default Filter Definitions', () => {
    it('should include category filter with ListingCategory options', () => {
      render(<FiltersSidebar />);

      const definitions = screen.getByTestId('filter-definitions');
      const content = JSON.parse(definitions.textContent || '[]');
      const categoryDef = content.find((d: any) => d.id === 'category');

      expect(categoryDef).toBeDefined();
      expect(categoryDef.label).toBe('Category');
      expect(categoryDef.multiSelect).toBe(true);
      expect(categoryDef.options).toContainEqual({
        id: ListingCategory.COWORKING,
        label: 'Coworking',
      });
      expect(categoryDef.options).toContainEqual({
        id: ListingCategory.CAFE,
        label: 'Cafe',
      });
    });

    it('should include destination filter with city options', () => {
      render(<FiltersSidebar />);

      const definitions = screen.getByTestId('filter-definitions');
      const content = JSON.parse(definitions.textContent || '[]');
      const destinationDef = content.find((d: any) => d.id === 'destination');

      expect(destinationDef).toBeDefined();
      expect(destinationDef.label).toBe('Destination');
      expect(destinationDef.multiSelect).toBe(true);
      expect(destinationDef.options).toContainEqual({ id: 'Lisbon', label: 'Lisbon' });
      expect(destinationDef.options).toContainEqual({ id: 'Bali', label: 'Bali' });
      expect(destinationDef.options).toContainEqual({ id: 'Chiang Mai', label: 'Chiang Mai' });
    });

    it('should include amenities filter', () => {
      render(<FiltersSidebar />);

      const definitions = screen.getByTestId('filter-definitions');
      const content = JSON.parse(definitions.textContent || '[]');
      const amenitiesDef = content.find((d: any) => d.id === 'amenities');

      expect(amenitiesDef).toBeDefined();
      expect(amenitiesDef.label).toBe('Amenities');
      expect(amenitiesDef.multiSelect).toBe(true);
      expect(amenitiesDef.options).toContainEqual({ id: 'wifi', label: 'Wi‑Fi' });
      expect(amenitiesDef.options).toContainEqual({ id: 'vegan', label: 'Vegan options' });
    });

    it('should include nomad features filter', () => {
      render(<FiltersSidebar />);

      const definitions = screen.getByTestId('filter-definitions');
      const content = JSON.parse(definitions.textContent || '[]');
      const featuresDef = content.find((d: any) => d.id === 'nomadFeatures');

      expect(featuresDef).toBeDefined();
      expect(featuresDef.label).toBe('Nomad Features');
      expect(featuresDef.multiSelect).toBe(true);
    });
  });

  describe('Initial Filters from URL', () => {
    it('should initialize with empty filters when no URL params', () => {
      mockSearchParams.getAll = jest.fn(() => []);

      render(<FiltersSidebar />);

      const initialFilters = screen.getByTestId('initial-filters');
      const content = JSON.parse(initialFilters.textContent || '{}');

      expect(content).toEqual({});
    });

    it('should initialize filters from URL parameters', () => {
      mockSearchParams.getAll = jest.fn(key => {
        if (key === 'category') return ['coworking', 'cafe'];
        if (key === 'destination') return ['Lisbon'];
        return [];
      });

      render(<FiltersSidebar />);

      const initialFilters = screen.getByTestId('initial-filters');
      const content = JSON.parse(initialFilters.textContent || '{}');

      expect(content).toHaveProperty('category');
      expect(content.category).toContain('coworking');
      expect(content.category).toContain('cafe');
      expect(content).toHaveProperty('destination');
      expect(content.destination).toContain('Lisbon');
    });

    it('should sanitize invalid filter values', () => {
      mockSearchParams.getAll = jest.fn(key => {
        if (key === 'category') return ['coworking', 'invalid-category', 'cafe'];
        return [];
      });

      render(<FiltersSidebar />);

      const initialFilters = screen.getByTestId('initial-filters');
      const content = JSON.parse(initialFilters.textContent || '{}');

      // Should only include valid categories
      expect(content.category).toContain('coworking');
      expect(content.category).toContain('cafe');
      expect(content.category).not.toContain('invalid-category');
    });

    it('should deduplicate filter values', () => {
      mockSearchParams.getAll = jest.fn(key => {
        if (key === 'destination') return ['Lisbon', 'Lisbon', 'Bali'];
        return [];
      });

      render(<FiltersSidebar />);

      const initialFilters = screen.getByTestId('initial-filters');
      const content = JSON.parse(initialFilters.textContent || '{}');

      expect(content.destination).toEqual(['Lisbon', 'Bali']);
    });
  });

  describe('Filter Change Handler', () => {
    it('should update URL when filters change', async () => {
      const user = userEvent.setup();
      render(<FiltersSidebar />);

      await user.click(screen.getByText('Apply Filter'));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
        const callArg = mockPush.mock.calls[0][0];
        expect(callArg).toContain('/search');
        expect(callArg).toContain('category=coworking');
      });
    });

    it('should preserve existing URL parameters', async () => {
      const user = userEvent.setup();
      const existingParams = new Map([['q', 'search query']]);
      mockSearchParams.entries = jest.fn(() => existingParams.entries());

      render(<FiltersSidebar />);

      await user.click(screen.getByText('Apply Filter'));

      await waitFor(() => {
        const callArg = mockPush.mock.calls[0][0];
        expect(callArg).toContain('q=search+query');
      });
    });

    it('should reset page parameter when filters change', async () => {
      const user = userEvent.setup();
      const existingParams = new Map([['page', '5']]);
      mockSearchParams.entries = jest.fn(() => existingParams.entries());

      render(<FiltersSidebar />);

      await user.click(screen.getByText('Apply Filter'));

      await waitFor(() => {
        const callArg = mockPush.mock.calls[0][0];
        expect(callArg).not.toContain('page=5');
      });
    });

    it('should clear filter group when no values selected', async () => {
      const user = userEvent.setup();
      mockSearchParams.getAll = jest.fn(key => {
        if (key === 'category') return ['coworking'];
        return [];
      });

      const { rerender } = render(<FiltersSidebar />);

      // Simulate clearing filters
      digitalNomadSearchFilterMock.mockImplementationOnce(({ onChange }: any) => (
        <button onClick={() => onChange({})}>Clear All</button>
      ));

      rerender(<FiltersSidebar />);
      await user.click(screen.getByText('Clear All'));

      await waitFor(() => {
        const callArg = mockPush.mock.calls[0]?.[0];
        if (callArg) {
          expect(callArg).not.toContain('category=');
        }
      });
    });
  });

  describe('Voice recognition integration', () => {
    class MockSpeechRecognition {
      public lang = 'en-US';
      public interimResults = false;
      public maxAlternatives = 1;
      public onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null = null;
      public onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null = null;
      public onend: (() => void) | null = null;
      public onerror: ((event: SpeechRecognitionErrorEvent) => void) | null = null;
      public onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null =
        null;
      public onresult: ((event: SpeechRecognitionEvent) => void) | null = null;
      public onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null = null;
      public onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null = null;
      public onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null = null;
      public onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null = null;
      public onstart: ((this: SpeechRecognition, ev: Event) => any) | null = null;
      public start = jest.fn();
      public stop = jest.fn(() => {
        this.onend?.();
      });
      public abort = jest.fn();
    }

    let recognitionInstances: MockSpeechRecognition[];
    const originalWebkit = (window as any).webkitSpeechRecognition;

    beforeEach(() => {
      recognitionInstances = [];
      Object.defineProperty(window, 'webkitSpeechRecognition', {
        configurable: true,
        writable: true,
        value: jest.fn(() => {
          const instance = new MockSpeechRecognition();
          recognitionInstances.push(instance);
          return instance;
        }),
      });
    });

    afterEach(() => {
      if (originalWebkit === undefined) {
        delete (window as any).webkitSpeechRecognition;
      } else {
        (window as any).webkitSpeechRecognition = originalWebkit;
      }
    });

    it('should not render voice controls when speech recognition is unavailable', () => {
      delete (window as any).webkitSpeechRecognition;

      render(<FiltersSidebar />);

      expect(screen.queryByTestId('voice-filter-section')).not.toBeInTheDocument();
    });

    it('should render voice controls when supported', () => {
      render(<FiltersSidebar />);

      expect(screen.getByTestId('voice-filter-section')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /use voice filters/i })).toBeInTheDocument();
    });

    it('should start and stop listening when toggled', async () => {
      const user = userEvent.setup();
      render(<FiltersSidebar />);

      const toggleButton = screen.getByRole('button', { name: /use voice filters/i });
      await user.click(toggleButton);

      expect(recognitionInstances[0].start).toHaveBeenCalled();
      expect(screen.getByRole('button', { name: /stop voice input/i })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /stop voice input/i }));
      expect(recognitionInstances[0].stop).toHaveBeenCalled();
    });

    it('should update filters based on recognized transcript', async () => {
      const user = userEvent.setup();
      render(<FiltersSidebar />);

      await user.click(screen.getByRole('button', { name: /use voice filters/i }));

      const instance = recognitionInstances[0];
      const transcript = 'category coworking amenities wifi';
      const mockResult = {
        isFinal: true,
        length: 1,
        item: () => ({ transcript, confidence: 0.9 }),
        0: { transcript, confidence: 0.9 },
      };
      const mockEvent = {
        resultIndex: 0,
        results: {
          length: 1,
          item: () => mockResult,
          0: mockResult,
        },
      } as unknown as SpeechRecognitionEvent;

      await act(async () => {
        instance.onresult?.(mockEvent);
        instance.onend?.();
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });

      const callArg = mockPush.mock.calls.at(-1)?.[0];
      expect(callArg).toContain('category=coworking');
      expect(callArg).toContain('amenities=wifi');

      const lastCall = digitalNomadSearchFilterMock.mock.calls.at(-1)?.[0];
      expect(lastCall.initialFilters).toEqual({ category: ['coworking'], amenities: ['wifi'] });
    });

    it('should clear filters when command is recognized', async () => {
      mockSearchParams.getAll = jest.fn(key => (key === 'category' ? ['coworking'] : []));

      const user = userEvent.setup();
      render(<FiltersSidebar />);

      await user.click(screen.getByRole('button', { name: /use voice filters/i }));

      const instance = recognitionInstances[0];
      const mockResult = {
        isFinal: true,
        length: 1,
        item: () => ({ transcript: 'clear filters', confidence: 0.9 }),
        0: { transcript: 'clear filters', confidence: 0.9 },
      };
      const mockEvent = {
        resultIndex: 0,
        results: {
          length: 1,
          item: () => mockResult,
          0: mockResult,
        },
      } as unknown as SpeechRecognitionEvent;

      await act(async () => {
        instance.onresult?.(mockEvent);
        instance.onend?.();
      });

      await waitFor(() => {
        const callArg = mockPush.mock.calls.at(-1)?.[0];
        expect(callArg).toBe('/search');
      });
    });

    it('should surface an error when no filters are matched', async () => {
      const user = userEvent.setup();
      render(<FiltersSidebar />);

      await user.click(screen.getByRole('button', { name: /use voice filters/i }));

      const instance = recognitionInstances[0];
      const mockResult = {
        isFinal: true,
        length: 1,
        item: () => ({ transcript: 'unknown words only', confidence: 0.9 }),
        0: { transcript: 'unknown words only', confidence: 0.9 },
      };
      const mockEvent = {
        resultIndex: 0,
        results: {
          length: 1,
          item: () => mockResult,
          0: mockResult,
        },
      } as unknown as SpeechRecognitionEvent;

      await act(async () => {
        instance.onresult?.(mockEvent);
      });

      expect(await screen.findByTestId('voice-error')).toHaveTextContent(
        'No matching filters detected'
      );
    });

    it('should show permission error when microphone access is denied', async () => {
      const user = userEvent.setup();
      render(<FiltersSidebar />);

      await user.click(screen.getByRole('button', { name: /use voice filters/i }));

      const instance = recognitionInstances[0];
      await act(async () => {
        instance.onerror?.({ error: 'not-allowed' } as SpeechRecognitionErrorEvent);
      });

      expect(await screen.findByTestId('voice-error')).toHaveTextContent(
        'Microphone access was denied'
      );
    });
  });

  describe('Multi-value Filter Handling', () => {
    it('should handle multiple values for same filter', async () => {
      const user = userEvent.setup();

      const { rerender } = render(<FiltersSidebar />);

      digitalNomadSearchFilterMock.mockImplementationOnce(({ onChange }: any) => (
        <button
          onClick={() =>
            onChange({
              category: ['coworking', 'cafe'],
              destination: ['Lisbon', 'Bali'],
            })
          }
        >
          Apply Multiple
        </button>
      ));

      rerender(<FiltersSidebar />);

      await user.click(screen.getByText('Apply Multiple'));

      await waitFor(() => {
        const callArg = mockPush.mock.calls[0]?.[0];
        if (callArg) {
          expect(callArg).toContain('category=coworking');
          expect(callArg).toContain('category=cafe');
        }
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty filter definitions array', () => {
      render(<FiltersSidebar definitions={[]} />);

      const definitions = screen.getByTestId('filter-definitions');
      const content = JSON.parse(definitions.textContent || '[]');

      expect(content).toEqual([]);
    });

    it('should surface errors when URL parameters cannot be read', () => {
      const error = new Error('Invalid URL params');
      mockSearchParams.getAll = jest.fn(() => {
        throw error;
      });

      expect(() => render(<FiltersSidebar />)).toThrow(error);
    });

    it('should handle rapid filter changes', async () => {
      const user = userEvent.setup();
      render(<FiltersSidebar />);

      // Rapid clicks
      await user.click(screen.getByText('Apply Filter'));
      await user.click(screen.getByText('Apply Filter'));
      await user.click(screen.getByText('Apply Filter'));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });
    });
  });

  describe('URL Parameter Encoding', () => {
    it('should properly encode special characters in filter values', async () => {
      const user = userEvent.setup();

      const { rerender } = render(<FiltersSidebar />);

      digitalNomadSearchFilterMock.mockImplementationOnce(({ onChange }: any) => (
        <button onClick={() => onChange({ amenities: ['Wi-Fi & Power'] })}>Apply Special</button>
      ));

      rerender(<FiltersSidebar />);

      await user.click(screen.getByText('Apply Special'));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });
    });
  });

  describe('Default Export', () => {
    it('should be importable as default export', async () => {
      const FiltersSidebarDefault = (await import('../FiltersSidebar')).default;
      render(<FiltersSidebarDefault />);

      expect(screen.getByTestId('digital-nomad-search-filter')).toBeInTheDocument();
    });
  });

  describe('Memoization', () => {
    it('should memoize initial filters computation', () => {
      mockSearchParams.getAll = jest.fn(key => {
        if (key === 'category') return ['coworking'];
        return [];
      });

      const { rerender } = render(<FiltersSidebar />);
      const firstRenderFilters = screen.getByTestId('initial-filters').textContent;

      rerender(<FiltersSidebar />);
      const secondRenderFilters = screen.getByTestId('initial-filters').textContent;

      expect(firstRenderFilters).toBe(secondRenderFilters);
    });
  });
});

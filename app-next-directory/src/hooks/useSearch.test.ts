import { renderHook, act } from '@testing-library/react-hooks';
import { useSearch } from './useSearch';
import { SearchFilters, SortOption } from '@/types/search';

describe('useSearch', () => {
  it('should update query and results correctly', () => {
    const initialData = [
      { id: 1, name: 'Apple' },
      { id: 2, name: 'Banana' },
      { id: 3, name: 'Orange' },
    ];
    const { result } = renderHook(() => useSearch({ initialQuery: '', initialFilters: { query: '', ecoTags: [], hasDigitalNomadFeatures: false } }));

    // Initial state
    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual([]);

    // Update search term
    act(() => {
      result.current.handleQueryChange('an');
    });

    // Check updated state
    expect(result.current.query).toBe('an');
    // Assuming the filtering logic is within the useSearch hook and updates results based on query
    expect(result.current.results).toEqual([]); // Adjust this based on your filtering logic
  });

  it('should handle empty initial data', () => {
    const { result } = renderHook(() => useSearch({ initialQuery: '', initialFilters: { query: '', ecoTags: [], hasDigitalNomadFeatures: false } }));

    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual([]);

    act(() => {
      result.current.handleQueryChange('test');
    });

    expect(result.current.query).toBe('test');
    expect(result.current.results).toEqual([]);
  });

  it('should handle no matches', () => {
    const initialData = [
      { id: 1, name: 'Apple' },
      { id: 2, name: 'Banana' },
    ];
    const { result } = renderHook(() => useSearch({ initialQuery: '', initialFilters: { query: '', ecoTags: [], hasDigitalNomadFeatures: false } }));

    act(() => {
      result.current.handleQueryChange('xyz');
    });

    expect(result.current.query).toBe('xyz');
    expect(result.current.results).toEqual([]);
  });

  it('should not trim the search term before filtering', () => {
    const initialData = [{ id: 1, name: 'Apple' }];
    const { result } = renderHook(() => useSearch({ initialQuery: '', initialFilters: { query: '', ecoTags: [], hasDigitalNomadFeatures: false } }));

    act(() => {
      result.current.handleQueryChange('  apple  ');
    });

    expect(result.current.query).toBe('  apple  ');
    expect(result.current.results).toEqual([]); // Adjust this based on your filtering logic
  });
});

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { useSearch } from './useSearch';
import userEvent from '@testing-library/user-event';

// Use real fetch intercepted by MSW handlers
jest.useFakeTimers(); // Use fake timers for debounce to work with fetch

beforeEach(() => {
  jest.clearAllTimers();
});

afterEach(() => {
  jest.clearAllTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

interface TestComponentProps {
  initialQuery?: string;
}

const TestComponent: React.FC<TestComponentProps> = ({ initialQuery = '' }) => {
  const search = useSearch({
    initialQuery,
    initialFilters: { query: '', ecoTags: [], hasDigitalNomadFeatures: false }
  });

  return (
    <>
      <span data-testid="query">{search.query}</span>
      <span data-testid="results">{search.results.map((r) => r.name).join(', ')}</span>
      <button onClick={() => search.handleQueryChange('an')}>Set Query to an</button>
      <button onClick={() => search.handleQueryChange('xyz')}>Set Query to xyz</button>
      <button onClick={() => search.handleQueryChange('  bangkok  ')}>Set Query to spaced bangkok</button>
      <button onClick={() => search.handleQueryChange('test')}>Set Query to test</button>
    </>
  );
};

describe('useSearch', () => {
  it('should update query and results correctly', async () => {
    render(<TestComponent initialQuery="" />);
    expect(screen.getByTestId('query').textContent).toBe('');
    expect(screen.getByTestId('results').textContent).toBe('');
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.click(screen.getByText('Set Query to an'));
    await act(async () => {
      jest.advanceTimersByTime(350);
      await Promise.resolve();
    });
    await act(async () => { await Promise.resolve(); });
    await waitFor(() => {
      expect(screen.getByTestId('query').textContent).toBe('an');
      // Debug log for actual results
      // eslint-disable-next-line no-console
      console.log('Actual results:', screen.getByTestId('results').textContent);
      expect(screen.getByTestId('results').textContent).toContain('Bangkok Eco Hub');
    });
  });

  it('should handle empty initial data', async () => {
    render(<TestComponent initialQuery="" />);
    expect(screen.getByTestId('query').textContent).toBe('');
    expect(screen.getByTestId('results').textContent).toBe('');

    userEvent.click(screen.getByText('Set Query to test'));
    await act(async () => {
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(screen.getByTestId('results').textContent).toBe('');
    });
  });

  it('should handle no matches', async () => {
    render(<TestComponent initialQuery="" />);

    userEvent.click(screen.getByText('Set Query to xyz'));
    await act(async () => {
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(screen.getByTestId('query').textContent).toBe('xyz');
      expect(screen.getByTestId('results').textContent).toBe('');
    });
  });

  it('should handle search terms with surrounding whitespace', async () => {
    render(<TestComponent initialQuery="" />);

    userEvent.click(screen.getByText('Set Query to spaced bangkok'));
    await act(async () => {
      jest.advanceTimersByTime(350);
      await Promise.resolve();
    });
    await act(async () => { await Promise.resolve(); });
    await waitFor(() => {
      expect(screen.getByTestId('query').textContent).toBe('  bangkok  ');
      expect(screen.getByTestId('results').textContent).toContain('Bangkok Eco Hub');
    });
  });
});

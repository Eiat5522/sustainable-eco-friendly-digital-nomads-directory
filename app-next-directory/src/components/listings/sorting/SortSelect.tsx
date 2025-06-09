'use client';

import { DEFAULT_SORT_OPTIONS, type SortOption } from '@/types/sort';
import { cn } from '@/lib/utils';

interface SortSelectProps {
  value?: SortOption;
  onChange: (option: SortOption) => void;
  className?: string;
}

export function SortSelect({ value, onChange, className = '' }: SortSelectProps): JSX.Element {
  const currentValue = value ? `${value.field}-${value.direction}` : '';

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!e.target.value) {
      onChange(DEFAULT_SORT_OPTIONS[0]);
      return;
    }
    const [field, direction] = e.target.value.split('-');
    const option = DEFAULT_SORT_OPTIONS.find((opt) => opt.field === field && opt.direction === direction);
    if (option) {
      onChange(option);
    }
  };

  return (
    <div className={cn('flex items-center space-x-3', className)}>
      <label htmlFor="sort-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Sort by:
      </label>
      <select
        id="sort-select"
        value={currentValue}
        onChange={handleChange}
        className="form-select rounded-lg border-gray-300 text-sm focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
      >
        {DEFAULT_SORT_OPTIONS.map((option) => (
          <option key={`${option.field}-${option.direction}`} value={`${option.field}-${option.direction}`}>
            {option.displayName} ({option.direction === 'asc' ? 'Low to High' : 'High to Low'})
          </option>
        ))}
      </select>
    </div>
  );
}

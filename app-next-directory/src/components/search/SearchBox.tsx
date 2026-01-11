'use client';

import { useCallback } from 'react';
import { NeoCard } from '@/components/ui/neo-card';
import { DigitalNomadSearch } from './DigitalNomadSearch';

interface SearchBoxProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
}

export function SearchBox({ placeholder, onSearch }: SearchBoxProps): React.JSX.Element {
  return (
    <NeoCard variant="flat" className="mb-6">
      <div className="p-4">
        <DigitalNomadSearch placeholder={placeholder} onSearch={onSearch} />
      </div>
    </NeoCard>
  );
}

export default SearchBox;

'use client';

import { NeoCard } from '@/components/ui/neo-card';
import { DigitalNomadSearch } from './DigitalNomadSearch';

interface SearchBoxProps {
  placeholder?: string;
}

export function SearchBox({ placeholder }: SearchBoxProps) {
  return (
    <NeoCard variant="flat" className="mb-6">
      <div className="p-4">
        <DigitalNomadSearch placeholder={placeholder} />
      </div>
    </NeoCard>
  );
}

export default SearchBox;

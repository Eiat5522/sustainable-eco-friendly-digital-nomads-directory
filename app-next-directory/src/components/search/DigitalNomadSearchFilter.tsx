'use client';
import { NeoButton } from '@/components/ui/neo-button';
import { NeoCard, NeoCardContent, NeoCardHeader, NeoCardTitle } from '@/components/ui/neo-card';
import { type FilterDefinition, useFilters } from '@/hooks/useFilters';

export interface DigitalNomadSearchFilterProps {
  definitions: FilterDefinition[];
  initialFilters?: { [groupId: string]: string[] };
  onChange?: (filters: { [groupId: string]: string[] }) => void;
  title?: string;
}

export function DigitalNomadSearchFilter({
  definitions,
  initialFilters,
  onChange,
  title = 'Filters',
}: DigitalNomadSearchFilterProps) {
  const { activeFilters, toggleFilter, clearFilters } = useFilters({
    definitions,
    initialFilters,
    onFilterChange: onChange,
  });

  return (
    <NeoCard variant="flat">
      <NeoCardHeader>
        <NeoCardTitle>{title}</NeoCardTitle>
      </NeoCardHeader>
      <NeoCardContent className="space-y-6">
        {definitions.map(group => (
          <div key={group.id}>
            <h4 className="heading-sm mb-2">{group.label}</h4>
            <div className="flex flex-col gap-2">
              {group.options.map(opt => {
                const checked = (activeFilters[group.id] || []).includes(opt.id);
                return (
                  <label key={opt.id} className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleFilter(group.id, opt.id)}
                      aria-label={`${group.label}: ${opt.label}`}
                    />
                    <span className="body-md">
                      {opt.label}
                      {typeof opt.count === 'number' ? ` (${opt.count})` : ''}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
        <div className="pt-2">
          <NeoButton type="button" variant="outline" size="sm" onClick={clearFilters}>
            Clear filters
          </NeoButton>
        </div>
      </NeoCardContent>
    </NeoCard>
  );
}

export default DigitalNomadSearchFilter;

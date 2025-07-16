'use client';

import React from 'react';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/Button';
import type { FilterCondition } from '@/types/components';
import { X } from 'lucide-react';

interface FilterConditionEditorProps {
  condition: FilterCondition;
  onUpdate: (condition: FilterCondition) => void;
  onRemove: () => void;
}

const FIELD_OPTIONS = [
  { value: 'category', label: 'Category' },
  { value: 'location', label: 'Location' },
  { value: 'ecoTags', label: 'Eco Tags' },
  { value: 'nomadFeatures', label: 'Nomad Features' },
  { value: 'minRating', label: 'Minimum Rating' },
  { value: 'maxPriceRange', label: 'Maximum Price' },
];

export function FilterConditionEditor({
  condition,
  onUpdate,
  onRemove,
}: FilterConditionEditorProps) {
  const handleFieldChange = (value: string) => {
    onUpdate({
      ...condition,
      field: value as FilterCondition['field'],
      value: '', // Reset value when field changes
    });
  };

  const handleValueChange = (value: string | number) => {
    onUpdate({
      ...condition,
      value,
    });
  };

  const renderValueInput = () => {
    switch (condition.field) {
      case 'category':
        return (
          <Select
            value={condition.value}
            onValueChange={handleValueChange}
            options={[
              { value: 'coworking', label: 'Coworking' },
              { value: 'cafe', label: 'Cafe' },
              { value: 'accommodation', label: 'Accommodation' },
            ]}
          />
        );
      case 'minRating':
        return (
          <Select
            value={String(condition.value)}
            onValueChange={(val: string) => handleValueChange(Number(val))}
            options={[
              { value: '1', label: '1★+' },
              { value: '2', label: '2★+' },
              { value: '3', label: '3★+' },
              { value: '4', label: '4★+' },
              { value: '5', label: '5★' },
            ]}
          />
        );
      case 'maxPriceRange':
        return (
          <Input
            type="number"
            value={condition.value === false ? '' : String(condition.value)}
            onChange={(e) => handleValueChange(Number(e.target.value))}
            min={0}
            step={100}
            placeholder="Max price"
          />
        );
      case 'ecoTags':
      case 'nomadFeatures':
        return (
          <Input
            type="text"
            value={condition.value === false ? '' : String(condition.value)}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder={`Enter ${condition.field === 'ecoTags' ? 'eco tag' : 'nomad feature'}`}
          />
        );
      case 'location':
      default:
        return (
          <Input
            type="text"
            value={condition.value === false ? '' : String(condition.value)}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder="Enter value"
          />
        );
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={condition.field}
        onValueChange={handleFieldChange}
        options={FIELD_OPTIONS}
      />
      <div className="flex-1">{renderValueInput()}</div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="text-gray-400 hover:text-gray-600"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

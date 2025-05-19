'use client';

import React, { useState } from 'react';
import type { FilterCondition } from '@/types/components';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Plus, Trash2 } from 'lucide-react';

interface FilterConditionEditorProps {
  conditions: FilterCondition[];
  onChange: (conditions: FilterCondition[]) => void;
}

const FIELD_OPTIONS = [
  { value: 'category', label: 'Category' },
  { value: 'location', label: 'Location' },
  { value: 'ecoTags', label: 'Eco Tags' },
  { value: 'nomadFeatures', label: 'Nomad Features' },
  { value: 'minRating', label: 'Minimum Rating' },
  { value: 'maxPriceRange', label: 'Max Price Range' },
];

export function FilterConditionEditor({ conditions, onChange }: FilterConditionEditorProps) {
  const [newCondition, setNewCondition] = useState<Partial<FilterCondition>>({});

  const addCondition = () => {
    if (!newCondition.field || !newCondition.value) return;
    
    onChange([...conditions, newCondition as FilterCondition]);
    setNewCondition({});
  };

  const removeCondition = (index: number) => {
    const newConditions = [...conditions];
    newConditions.splice(index, 1);
    onChange(newConditions);
  };

  const updateField = (value: string) => {
    setNewCondition({ ...newCondition, field: value as keyof FilterCondition['field'] });
  };

  const updateValue = (value: string) => {
    setNewCondition({ ...newCondition, value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Select
            value={newCondition.field as string}
            onValueChange={updateField}
            options={FIELD_OPTIONS}
            placeholder="Select field"
          />
        </div>
        <div className="flex-1">
          <Input
            value={newCondition.value as string || ''}
            onChange={(e) => updateValue(e.target.value)}
            placeholder="Enter value"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={addCondition}
          disabled={!newCondition.field || !newCondition.value}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {conditions.map((condition, index) => (
          <div key={index} className="flex items-center justify-between p-2 rounded-md bg-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{condition.field}:</span>
              <span className="text-sm">{condition.value}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeCondition(index)}
              className="text-gray-400 hover:text-gray-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { FilterGroup, FilterOperator } from '@/types/components';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PlusCircle, XCircle } from 'lucide-react';
import { FilterConditionEditor } from './FilterConditionEditor';

interface FilterCombinationsProps {
  combinations: FilterGroup[];
  onCombinationsChange: (combinations: FilterGroup[]) => void;
  globalOperator: FilterOperator;
  onGlobalOperatorChange: (operator: FilterOperator) => void;
}

export function FilterCombinations({
  combinations,
  onCombinationsChange,
  globalOperator,
  onGlobalOperatorChange,
}: FilterCombinationsProps) {
  const addGroup = () => {
    const newGroup: FilterGroup = {
      conditions: [],
      operator: 'AND',
      isEnabled: true,
      label: `Group ${combinations.length + 1}`,
    };
    onCombinationsChange([...combinations, newGroup]);
  };

  const removeGroup = (index: number) => {
    const newCombinations = [...combinations];
    newCombinations.splice(index, 1);
    onCombinationsChange(newCombinations);
  };

  const toggleGroupOperator = (index: number) => {
    const newCombinations = [...combinations];
    newCombinations[index].operator = newCombinations[index].operator === 'AND' ? 'OR' : 'AND';
    onCombinationsChange(newCombinations);
  };

  const toggleGroupEnabled = (index: number) => {
    const newCombinations = [...combinations];
    newCombinations[index].isEnabled = !newCombinations[index].isEnabled;
    onCombinationsChange(newCombinations);
  };

  const toggleGlobalOperator = () => {
    onGlobalOperatorChange(globalOperator === 'AND' ? 'OR' : 'AND');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Filter Combinations</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={addGroup}
          className="flex items-center gap-1"
        >
          <PlusCircle className="h-4 w-4" />
          Add Group
        </Button>
      </div>

      {combinations.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Combine groups with:</span>
          <Badge
            variant="outline"
            className="cursor-pointer"
            onClick={toggleGlobalOperator}
          >
            {globalOperator}
          </Badge>
        </div>
      )}

      <div className="space-y-3">
        {combinations.map((group, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative p-3 border rounded-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge
                  variant={group.isEnabled ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleGroupEnabled(index)}
                >
                  {group.label}
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => toggleGroupOperator(index)}
                >
                  {group.operator}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeGroup(index)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>            <div className="pl-4 border-l-2 border-gray-200">
              <div className="space-y-3">
                {group.conditions.map((condition, condIndex) => (
                  <FilterConditionEditor
                    key={condIndex}
                    condition={condition}
                    onUpdate={(updatedCondition) => {
                      const newCombinations = [...combinations];
                      newCombinations[index].conditions[condIndex] = updatedCondition;
                      onCombinationsChange(newCombinations);
                    }}
                    onRemove={() => {
                      const newCombinations = [...combinations];
                      newCombinations[index].conditions.splice(condIndex, 1);
                      onCombinationsChange(newCombinations);
                    }}
                  />
                ))}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newCombinations = [...combinations];
                    newCombinations[index].conditions.push({
                      field: 'category',
                      value: '',
                    });
                    onCombinationsChange(newCombinations);
                  }}
                  className="w-full flex items-center justify-center gap-1"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Condition
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

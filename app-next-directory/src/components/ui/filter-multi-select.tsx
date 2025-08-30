'use client';

import * as React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, ChevronDown } from 'lucide-react';
import { NeoButton } from './neo-button';

import { cn } from '@/lib/utils';

export interface Option {
  value: string;
  label: string;
  icon: React.ElementType;
}

interface FilterMultiSelectProps {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  triggerIcon?: React.ElementType;
}

export function FilterMultiSelect({ label, options, selected, onChange, triggerIcon }: FilterMultiSelectProps) {
  const handleSelect = (value: string, checked: boolean) => {
    if (checked) {
      onChange([...selected, value]);
    } else {
      onChange(selected.filter((v) => v !== value));
    }
  };

  const buttonLabel = selected.length > 0 ? `${label} (${selected.length})` : label;
  const TriggerIcon = triggerIcon;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <NeoButton
          type="button"
          variant="outline"
          size="md"
          className="flex items-center gap-2"
        >
          {TriggerIcon && <TriggerIcon className="h-4 w-4" />}
          {buttonLabel}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </NeoButton>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        sideOffset={4}
        className="min-w-[220px] rounded-md border-2 border-neo-border bg-white p-2 shadow-md"
      >
        {options.map((opt) => {
          const Icon = opt.icon;
          return (
            <DropdownMenu.CheckboxItem
              key={opt.value}
              checked={selected.includes(opt.value)}
              onCheckedChange={(checked) => handleSelect(opt.value, checked === true)}
              className={cn(
                'flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-neo-accent focus:text-white'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{opt.label}</span>
              <DropdownMenu.ItemIndicator className="ml-auto">
                <Check className="h-4 w-4" />
              </DropdownMenu.ItemIndicator>
            </DropdownMenu.CheckboxItem>
          );
        })}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}


"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  MapPin,
  Search,
  ChevronDown,
  Check,
  Leaf,
  Laptop,
  TreePine,
  Coffee,
  Mountain,
  Waves,
  Sun,
  Wind,
  Zap,
  Car,
  Bike,
  Heart,
  Building,
} from "lucide-react";

// Types and interfaces
interface FilterOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SearchFilters {
  searchText: string;
  destinations: string[];
  categories: string[];
  amenities: string[];
}

// Sample data - Eco-friendly digital nomad focused
const DESTINATIONS: FilterOption[] = [
{ value: "bali", label: "Bali, Indonesia", icon: <TreePine className="h-4 w-4 text-gray-500" /> },
  { value: "costa-rica", label: "Costa Rica", icon: <Leaf className="h-4 w-4 text-gray-500" /> },
  { value: "lisbon", label: "Lisbon, Portugal", icon: <Sun className="h-4 w-4 text-gray-500" /> },
  { value: "tulum", label: "Tulum, Mexico", icon: <Waves className="h-4 w-4 text-gray-500" /> },
  { value: "banff", label: "Banff, Canada", icon: <Mountain className="h-4 w-4 text-gray-500" /> },
  { value: "reykjavik", label: "Reykjavik, Iceland", icon: <Wind className="h-4 w-4 text-gray-500" /> },

];

const CATEGORIES: FilterOption[] = [
  { value: "coworking", label: "Eco Coworking", icon: <Laptop className="h-4 w-4 text-gray-500" /> },
  { value: "cafe", label: "Green Cafés", icon: <Coffee className="h-4 w-4 text-gray-500" /> },
  { value: "accommodation", label: "Sustainable Stays", icon: <Leaf className="h-4 w-4 text-gray-500" /> },
  { value: "activity", label: "Outdoor Activities", icon: <TreePine className="h-4 w-4 text-gray-500" /> },
  { value: "restaurant", label: "Sustainable Restaurants", icon: <Building className="h-4 w-4 text-gray-500" /> },
];

const AMENITIES: FilterOption[] = [
  { value: "solar-wifi", label: "Solar-Powered WiFi", icon: <Zap className="h-4 w-4 text-amber-600" /> },
  { value: "bike-rental", label: "Bike Rental", icon: <Bike className="h-4 w-4 text-green-600" /> },
  { value: "organic-food", label: "Organic Food", icon: <Leaf className="h-4 w-4 text-green-600" /> },
  { value: "zero-waste", label: "Zero Waste", icon: <TreePine className="h-4 w-4 text-green-600" /> },
  { value: "renewable-energy", label: "Renewable Energy", icon: <Sun className="h-4 w-4 text-yellow-600" /> },
  { value: "local-sourced", label: "Locally Sourced", icon: <Heart className="h-4 w-4 text-green-600" /> },
  { value: "carbon-neutral", label: "Carbon Neutral", icon: <Wind className="h-4 w-4 text-blue-600" /> },
  { value: "eco-transport", label: "Eco Transport", icon: <Car className="h-4 w-4 text-green-600" /> },
];

// Multi-select dropdown component
interface MultiSelectDropdownProps {
  options: FilterOption[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  placeholder: string;
  icon: React.ReactNode;
  label: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  selectedValues,
  onSelectionChange,
  placeholder,
  icon,
  label,
}) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onSelectionChange(newValues);
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) {
      const option = options.find((opt) => opt.value === selectedValues[0]);
      return option?.label || placeholder;
    }
    return `${selectedValues.length} selected`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-12 px-4 border-gray-200 hover:border-green-400 hover:bg-green-50 transition-colors rounded-lg"
        >
          <div className="flex items-center gap-2 min-w-0">
            {icon}
            <span className="truncate">{getDisplayText()}</span>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 border-green-200 shadow-lg" align="start">
        <Command>
          <CommandList>
            <CommandEmpty>No {label.toLowerCase()} found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => handleSelect(option.value)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedValues.includes(option.value)}
                    onCheckedChange={() => handleSelect(option.value)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Toggle ${option.label}`}
                  />
                  {option.icon}
                  <span>{option.label}</span>
                  {selectedValues.includes(option.value) && (
                    <Check className="ml-auto h-4 w-4 text-green-600" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

// Main search filter component
export interface DigitalNomadSearchProps {
  onFiltersChange?: (filters: SearchFilters) => void;
  className?: string;
}

const DigitalNomadSearch: React.FC<DigitalNomadSearchProps> = ({
  onFiltersChange,
  className,
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    searchText: "",
    destinations: [],
    categories: [],
    amenities: [],
  });

  const updateFilters = useCallback(
    (newFilters: Partial<SearchFilters>) => {
      setFilters((prevFilters) => {
        const updatedFilters = { ...prevFilters, ...newFilters };
        onFiltersChange?.(updatedFilters);
        return updatedFilters;
      });
    },
    [onFiltersChange]
  );

  return (
    <div data-testid="digital-nomad-search" className={cn("w-full p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-sm", className)}>
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Search eco-friendly workspaces, cafés, and sustainable stays..."
          value={filters.searchText}
          onChange={(e) => updateFilters({ searchText: e.target.value })}
          className="pl-12 h-14 text-base border-gray-200 focus:border-green-400 focus:ring-green-400 rounded-xl"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            Eco Destinations
          </label>
          <MultiSelectDropdown
            options={DESTINATIONS}
            selectedValues={filters.destinations}
            onSelectionChange={(values) => updateFilters({ destinations: values })}
            placeholder="Select green destinations"
            icon={<MapPin className="h-4 w-4 text-gray-500" />}
            label="destinations"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
            <Building className="h-4 w-4" />
            Workspace Type
          </label>
          <MultiSelectDropdown
            options={CATEGORIES}
            selectedValues={filters.categories}
            onSelectionChange={(values) => updateFilters({ categories: values })}
            placeholder="Select workspace types"
            icon={<Building className="h-4 w-4 text-gray-500" />}
            label="categories"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
            <Leaf className="h-4 w-4" />
            Eco Features
          </label>
          <MultiSelectDropdown
            options={AMENITIES}
            selectedValues={filters.amenities}
            onSelectionChange={(values) => updateFilters({ amenities: values })}
            placeholder="Select eco amenities"
            icon={<Leaf className="h-4 w-4 text-gray-500" />}
            label="amenities"
          />
        </div>
      </div>
    </div>
  );
};

export default DigitalNomadSearch;

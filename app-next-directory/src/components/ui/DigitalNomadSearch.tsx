"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  MapPin,
  Search,
  ChevronDown,
  X,
  Check,
  Filter,
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
  { value: "bali", label: "Bali, Indonesia", icon: <TreePine className="h-4 w-4 text-green-600" /> },
  { value: "costa-rica", label: "Costa Rica", icon: <Leaf className="h-4 w-4 text-green-600" /> },
  { value: "lisbon", label: "Lisbon, Portugal", icon: <Sun className="h-4 w-4 text-green-600" /> },
  { value: "tulum", label: "Tulum, Mexico", icon: <Waves className="h-4 w-4 text-green-600" /> },
  { value: "banff", label: "Banff, Canada", icon: <Mountain className="h-4 w-4 text-green-600" /> },
  { value: "reykjavik", label: "Reykjavik, Iceland", icon: <Wind className="h-4 w-4 text-green-600" /> },
];

const CATEGORIES: FilterOption[] = [
  { value: "coworking", label: "Eco Coworking", icon: <Laptop className="h-4 w-4 text-emerald-600" /> },
  { value: "cafe", label: "Green Cafés", icon: <Coffee className="h-4 w-4 text-emerald-600" /> },
  { value: "accommodation", label: "Sustainable Stays", icon: <Leaf className="h-4 w-4 text-emerald-600" /> },
  { value: "outdoor", label: "Outdoor Workspaces", icon: <TreePine className="h-4 w-4 text-emerald-600" /> },
  { value: "wellness", label: "Wellness Centers", icon: <Heart className="h-4 w-4 text-emerald-600" /> },
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
  const [searchValue, setSearchValue] = useState("");

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleSelect = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onSelectionChange(newValues);
  };

  const handleClear = () => {
    onSelectionChange([]);
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
          className="w-full justify-between h-10 px-3 border-green-200 hover:border-green-400 hover:bg-green-50 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            {icon}
            <span className="truncate">{getDisplayText()}</span>
          </div>
          <div className="flex items-center gap-1 ml-2">
            {selectedValues.length > 0 && (
              <span
                role="button"
                aria-label="Clear selection"
                tabIndex={0}
                className="h-4 w-4 p-0 hover:bg-red-100 hover:text-red-600 inline-flex items-center justify-center rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    handleClear();
                  }
                }}
              >
                <X className="h-3 w-3" />
              </span>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 border-green-200 shadow-lg" align="start">
        <Command>
          <CommandInput
            placeholder={`Search ${label.toLowerCase()}...`}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>No {label.toLowerCase()} found.</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
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
                    <Check className="ml-auto h-4 w-4" />
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

// Active filter chip component
interface FilterChipProps {
  label: string;
  count?: number;
  onRemove: () => void;
  icon?: React.ReactNode;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, count, onRemove, icon }) => {
  const displayText = count && count > 1 ? `${label} (${count})` : label;

  return (
    <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm border border-green-200">
      {icon}
      <span>{displayText}</span>
      <Button
        variant="ghost"
        size="sm"
        className="h-4 w-4 p-0 hover:bg-green-200 rounded-full ml-1"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
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

  const clearAllFilters = () => {
    const emptyFilters: SearchFilters = {
      searchText: "",
      destinations: [],
      categories: [],
      amenities: [],
    };
    setFilters(emptyFilters);
    onFiltersChange?.(emptyFilters);
  };

  const hasActiveFilters =
    filters.searchText ||
    filters.destinations.length > 0 ||
    filters.categories.length > 0 ||
    filters.amenities.length > 0;

  const getFilterLabel = (type: keyof SearchFilters, options: FilterOption[]) => {
    const values = filters[type] as string[];
    if (values.length === 0) return "";
    if (values.length === 1) {
      const option = options.find((opt) => opt.value === values[0]);
      return option?.label || "";
    }
    return `${type.charAt(0).toUpperCase() + type.slice(1)}`;
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-600" />
        <Input
          placeholder="Search eco-friendly workspaces, cafés, and sustainable stays..."
          value={filters.searchText}
          onChange={(e) => updateFilters({ searchText: e.target.value })}
          className="pl-10 h-12 text-base border-green-200 focus:border-green-400 focus:ring-green-400 rounded-lg"
        />
      </div>

      {/* Filter Dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-green-800 flex items-center gap-2">
            <TreePine className="h-4 w-4" />
            Eco Destinations
          </label>
          <MultiSelectDropdown
            options={DESTINATIONS}
            selectedValues={filters.destinations}
            onSelectionChange={(values) => updateFilters({ destinations: values })}
            placeholder="Select green destinations"
            icon={<MapPin className="h-4 w-4 text-green-600" />}
            label="destinations"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-green-800 flex items-center gap-2">
            <Laptop className="h-4 w-4" />
            Workspace Type
          </label>
          <MultiSelectDropdown
            options={CATEGORIES}
            selectedValues={filters.categories}
            onSelectionChange={(values) => updateFilters({ categories: values })}
            placeholder="Select workspace types"
            icon={<Laptop className="h-4 w-4 text-emerald-600" />}
            label="categories"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-green-800 flex items-center gap-2">
            <Leaf className="h-4 w-4" />
            Eco Features
          </label>
          <MultiSelectDropdown
            options={AMENITIES}
            selectedValues={filters.amenities}
            onSelectionChange={(values) => updateFilters({ amenities: values })}
            placeholder="Select eco amenities"
            icon={<Leaf className="h-4 w-4 text-green-600" />}
            label="amenities"
          />
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-green-800 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Active Filters
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-green-600 hover:text-green-800 hover:bg-green-50"
            >
              Clear all
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.searchText && (
              <FilterChip
                label={`"${filters.searchText}"`}
                onRemove={() => updateFilters({ searchText: "" })}
                icon={<Search className="h-3 w-3" />}
              />
            )}
            {filters.destinations.length > 0 && (
              <FilterChip
                label={getFilterLabel("destinations", DESTINATIONS)}
                count={filters.destinations.length}
                onRemove={() => updateFilters({ destinations: [] })}
                icon={<MapPin className="h-3 w-3 text-green-600" />}
              />
            )}
            {filters.categories.length > 0 && (
              <FilterChip
                label={getFilterLabel("categories", CATEGORIES)}
                count={filters.categories.length}
                onRemove={() => updateFilters({ categories: [] })}
                icon={<Laptop className="h-3 w-3 text-emerald-600" />}
              />
            )}
            {filters.amenities.length > 0 && (
              <FilterChip
                label={getFilterLabel("amenities", AMENITIES)}
                count={filters.amenities.length}
                onRemove={() => updateFilters({ amenities: [] })}
                icon={<Leaf className="h-3 w-3 text-green-600" />}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalNomadSearch;

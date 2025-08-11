"use client"

import * as React from 'react';
import { Button } from "./Button"
import { Input } from "./input"
import { Checkbox } from "./checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./dropdown-menu"
import {
  X, Search, Filter, Globe, Building, Mountain, Plane, MapPin, BriefcaseBusiness,
  BedDouble, Utensils, Activity, Users, Coffee, Lightbulb, Wifi, Camera, Sparkles,
  Car, Dumbbell, Bus, Leaf, Soup, ChevronDown
} from "lucide-react"
import { MotionConfig, motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

// Multi-select filter state type
export interface MultiSelectFilters {
  destination: string[];
  category: string[];
  nomadFeatures: string[];
  amenities: string[];
}

// Amenity type for filter
interface Amenity {
  _id: string;
  name: string;
  description?: string;
  badge?: {
    asset?: {
      url?: string;
    };
  };
}

// Enhanced Select Component for Nomad Features
type NomadFeature = {
  id: string;
  label: string;
  value: string;
  description?: string;
  icon: React.ReactNode;
  category: string;
};

// Filter Badge Component
const filterBadgeVariants = cva(
  "inline-flex items-center bg-background text-sm text-muted-foreground border",
  {
    variants: {
      variant: {
        default: "rounded-lg gap-x-2.5 py-1 pl-2.5 pr-1",
        pill: "rounded-full gap-x-2.5 py-1 pl-2.5 pr-1",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface FilterBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
  VariantProps<typeof filterBadgeVariants> {
  className?: string; // Added for explicit type recognition
  label?: string
  value?: string
  children?: React.ReactNode
  onRemove?: () => void
}

const FilterBadge = ({
  className,
  variant,
  label,
  value,
  children,
  onRemove,
  onClick,
  ...props
}: FilterBadgeProps & { onClick?: () => void }) => {
  return (
    <span
      className={cn(filterBadgeVariants({ variant }), className)}
      onClick={onClick}
      {...props}
    >
      {children}
      {label && (
        <>
          <span className="ml-1">{label}</span>
          <span className="h-4 w-px bg-border mx-1" />
        </>
      )}
      {onRemove && (
        <button
          type="button"
          title="Remove filter"
          aria-label={`Remove ${label} filter`}
          className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-muted"
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  )
}

interface SearchFilterProps {
  onSearch?: (query: string) => void;
  onFilterChange?: (filters: MultiSelectFilters) => void;
}

export default function DigitalNomadSearchFilter({ onSearch, onFilterChange }: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeFilters, setActiveFilters] = React.useState<MultiSelectFilters>({
    destination: [],
    category: [],
    nomadFeatures: [],
    amenities: [],
  });
  const [isFocused, setIsFocused] = React.useState(false);
  const [showFilters, setShowFilters] = React.useState(false);
  const [amenities, setAmenities] = React.useState<Amenity[]>([]);
  const [amenitiesLoading, setAmenitiesLoading] = React.useState(true);
  const [amenitiesError, setAmenitiesError] = React.useState<string | null>(null);

  // Standardized city/destination list
  const destinations: NomadFeature[] = [
    { id: "bangkok", label: "Bangkok", value: "bangkok", icon: <Building className="w-5 h-5 text-orange-500" />, category: "destination" },
    { id: "chiang_mai", label: "Chiang Mai", value: "chiang_mai", icon: <Mountain className="w-5 h-5 text-green-500" />, category: "destination" },
    { id: "phuket", label: "Phuket", value: "phuket", icon: <Plane className="w-5 h-5 text-blue-500" />, category: "destination" },
    { id: "koh_tao", label: "Koh Tao", value: "koh_tao", icon: <Globe className="w-5 h-5 text-cyan-500" />, category: "destination" },
    { id: "koh_phangan", label: "Koh Phangan", value: "koh_phangan", icon: <Globe className="w-5 h-5 text-purple-500" />, category: "destination" },
    { id: "koh_samui", label: "Koh Samui", value: "koh_samui", icon: <Globe className="w-5 h-5 text-pink-500" />, category: "destination" },
    { id: "krabi", label: "Krabi", value: "krabi", icon: <MapPin className="w-5 h-5 text-red-500" />, category: "destination" },
    { id: "pattaya", label: "Pattaya", value: "pattaya", icon: <Building className="w-5 h-5 text-yellow-500" />, category: "destination" },
  ];

  // Standardized 5 categories/types
  const categories: NomadFeature[] = [
    { id: "coworking", label: "Coworking", value: "coworking", icon: <BriefcaseBusiness className="w-5 h-5 text-purple-500" />, category: "category" },
    { id: "accommodation", label: "Accommodation", value: "accommodation", icon: <BedDouble className="w-5 h-5 text-blue-500" />, category: "category" },
    { id: "cafe", label: "Cafe", value: "cafe", icon: <Coffee className="w-5 h-5 text-amber-700" />, category: "category" },
    { id: "restaurant", label: "Restaurant", value: "restaurant", icon: <Utensils className="w-5 h-5 text-green-600" />, category: "category" },
    { id: "activities", label: "Activities", value: "activities", icon: <Activity className="w-5 h-5 text-green-600" />, category: "category" },
  ];

  // Fetch amenities 
  React.useEffect(() => {
    async function fetchAmenities() {
      try {
        setAmenitiesLoading(true);
        const res = await fetch('/api/amenities');
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch amenities');
        }
        // Support both { amenities: Amenity[] } and direct array responses
        setAmenities(data.amenities ?? data);
      } catch (err) {
        setAmenitiesError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setAmenitiesLoading(false);
      }
    }

    fetchAmenities();
  }, []);

  // Handler for selecting/deselecting destinations
  const handleDestinationSelect = (id: string) => {
    const updated = activeFilters.destination.includes(id)
      ? activeFilters.destination.filter(did => did !== id)
      : [...activeFilters.destination, id];
    const newFilters = { ...activeFilters, destination: updated };
    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  // Handler for selecting/deselecting categories
  const handleCategorySelect = (id: string) => {
    const updated = activeFilters.category.includes(id)
      ? activeFilters.category.filter(cid => cid !== id)
      : [...activeFilters.category, id];
    const newFilters = { ...activeFilters, category: updated };
    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  // Handler for selecting/deselecting amenities
  const handleAmenitySelect = (id: string) => {
    const updated = activeFilters.amenities.includes(id)
      ? activeFilters.amenities.filter(aid => aid !== id)
      : [...activeFilters.amenities, id];
    const newFilters = { ...activeFilters, amenities: updated };
    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  // Handler for search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch?.(value);
  };

  // Handler for clearing all filters
  const handleClearFilters = () => {
    const clearedFilters: MultiSelectFilters = {
      destination: [],
      category: [],
      nomadFeatures: [],
      amenities: [],
    };
    setActiveFilters(clearedFilters);
    onFilterChange?.(clearedFilters);
  };

  // Handler for removing individual filter
  const handleRemoveFilter = (filterType: keyof MultiSelectFilters, value: string) => {
    const updated = activeFilters[filterType].filter(item => item !== value);
    const newFilters = { ...activeFilters, [filterType]: updated };
    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  // Count active filters
  const getActiveFilterCount = () => {
    return Object.values(activeFilters).reduce((count, arr) => count + arr.length, 0);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Search Input */}
      <div className="relative mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="search-input"
            type="text"
            placeholder="Search destinations, cafes, coworking spaces..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10 pr-10 h-12 text-lg"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                onSearch?.("");
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Destinations Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              id="destinations-filter"
            >
              <MapPin className="h-4 w-4" />
              Destinations
              {activeFilters.destination.length > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                  {activeFilters.destination.length}
                </span>
              )}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" id="destinations-dropdown">
            <DropdownMenuLabel>Select Destinations</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {destinations.map((destination) => (
              <DropdownMenuCheckboxItem
                key={`destination-${destination.id}`}
                checked={activeFilters.destination.includes(destination.value)}
                onCheckedChange={() => handleDestinationSelect(destination.value)}
              >
                <div className="flex items-center gap-2">
                  {destination.icon}
                  <span>{destination.label}</span>
                </div>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Categories Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              id="categories-filter"
            >
              <Filter className="h-4 w-4" />
              Categories
              {activeFilters.category.length > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                  {activeFilters.category.length}
                </span>
              )}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" id="categories-dropdown">
            <DropdownMenuLabel>Select Categories</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {categories.map((category) => (
              <DropdownMenuCheckboxItem
                key={`category-${category.id}`}
                checked={activeFilters.category.includes(category.value)}
                onCheckedChange={() => handleCategorySelect(category.value)}
              >
                <div className="flex items-center gap-2">
                  {category.icon}
                  <span>{category.label}</span>
                </div>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Amenities Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              id="amenities-filter"
            >
              <Sparkles className="h-4 w-4" />
              Amenities
              {activeFilters.amenities.length > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                  {activeFilters.amenities.length}
                </span>
              )}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 max-h-80 overflow-y-auto" id="amenities-dropdown">
            <DropdownMenuLabel>Select Amenities</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {amenitiesLoading && (
              <div className="px-2 py-1 text-sm text-muted-foreground">Loading amenities...</div>
            )}
            {amenitiesError && (
              <div className="px-2 py-1 text-sm text-red-500">Error: {amenitiesError}</div>
            )}
            {!amenitiesLoading && !amenitiesError && amenities.map((amenity) => (
              <DropdownMenuCheckboxItem
                key={`amenity-${amenity._id}`}
                checked={activeFilters.amenities.includes(amenity._id)}
                onCheckedChange={() => handleAmenitySelect(amenity._id)}
              >
                <div className="flex items-center gap-2">
                  {amenity.badge?.asset?.url && (
                    <img
                      src={amenity.badge.asset.url}
                      alt={amenity.name}
                      className="w-4 h-4 rounded-full"
                    />
                  )}
                  <span>{amenity.name}</span>
                </div>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear All Filters Button */}
        {getActiveFilterCount() > 0 && (
          <Button 
            variant="ghost" 
            onClick={handleClearFilters}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            Clear All ({getActiveFilterCount()})
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {getActiveFilterCount() > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-3 text-muted-foreground">Active Filters:</h3>
          <div className="flex flex-wrap gap-2">
            {/* Destination badges */}
            {activeFilters.destination.map((dest) => {
              const destObj = destinations.find(d => d.value === dest);
              return (
                <FilterBadge
                  key={`active-dest-${dest}`}
                  variant="pill"
                  label={destObj?.label || dest}
                  onRemove={() => handleRemoveFilter('destination', dest)}
                  className="bg-blue-50 text-blue-700 border-blue-200"
                >
                  <MapPin className="h-3 w-3" />
                </FilterBadge>
              );
            })}
            
            {/* Category badges */}
            {activeFilters.category.map((cat) => {
              const catObj = categories.find(c => c.value === cat);
              return (
                <FilterBadge
                  key={`active-cat-${cat}`}
                  variant="pill"
                  label={catObj?.label || cat}
                  onRemove={() => handleRemoveFilter('category', cat)}
                  className="bg-green-50 text-green-700 border-green-200"
                >
                  <Filter className="h-3 w-3" />
                </FilterBadge>
              );
            })}
            
            {/* Amenity badges */}
            {activeFilters.amenities.map((amenityId) => {
              const amenityObj = amenities.find(a => a._id === amenityId);
              return (
                <FilterBadge
                  key={`active-amenity-${amenityId}`}
                  variant="pill"
                  label={amenityObj?.name || amenityId}
                  onRemove={() => handleRemoveFilter('amenities', amenityId)}
                  className="bg-purple-50 text-purple-700 border-purple-200"
                >
                  <Sparkles className="h-3 w-3" />
                </FilterBadge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
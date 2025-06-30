"use client"

import React from 'react'
import { Button } from "./Button"
import { X, Search, Filter, Globe, Building, Mountain, Plane, MapPin, BriefcaseBusiness, 
  BedDouble, Utensils, Activity, Users, Coffee, Lightbulb, Wifi, Camera, Sparkles, 
  Car, Dumbbell, Bus, Leaf, Soup, ChevronDown } from "lucide-react"
import { MotionConfig, motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

// Multi-select filter state type
type MultiSelectFilters = {
  destination: string[];
  category: string[];
  features_amenities: string[];
};

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
          onClick={(e) => {
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


// Enhanced Select Component for Nomad Features
interface NomadSelectProps {
  id: string;
  data?: NomadFeature[];
  onChange?: (value: string) => void;
  defaultValue?: string;
  placeholder?: string;
  selectedValue?: string;
}

const NomadSelect = ({ 
  id, 
  data, 
  defaultValue, 
  placeholder = "Select feature", 
  onChange, 
  selectedValue 
}: NomadSelectProps) => {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<NomadFeature | undefined>(undefined);

  React.useEffect(() => {
    if (selectedValue) {
      const foundItem = data?.find((item: NomadFeature) => item.value === selectedValue);
      if (foundItem) {
        setSelected(foundItem);
      }
    } else if (defaultValue) {
      const foundItem = data?.find((item: NomadFeature) => item.value === defaultValue);
      if (foundItem) {
        setSelected(foundItem);
      }
    } else {
      setSelected(undefined);
    }
  }, [defaultValue, data, selectedValue]);

  const onSelect = (value: string) => {
    const foundItem = data?.find((item: NomadFeature) => item.value === value);
    setSelected(foundItem);
    setOpen(false);
    onChange?.(value);
  };

  return (
    <div>
      {/* Component content */}
    </div>
  );
};

// Main Search Filter Component
interface SearchFilterProps {
  onSearch?: (query: string) => void;
  onFilterChange?: (filters: MultiSelectFilters) => void;
}

export default function DigitalNomadSearchFilter({ onSearch, onFilterChange }: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeFilters, setActiveFilters] = React.useState<MultiSelectFilters>({
    destination: [],
    category: [],
    features_amenities: [],
  });
  const [isFocused, setIsFocused] = React.useState(false);
  const [showFilters, setShowFilters] = React.useState(false);

  const destinations: NomadFeature[] = [
    { id: "bangkok", label: "Bangkok", value: "bangkok", icon: <Building className="w-5 h-5 text-orange-500" />, category: "destination" },
    { id: "chiang_mai", label: "Chiang Mai", value: "chiang_mai", icon: <Mountain className="w-5 h-5 text-green-500" />, category: "destination" },
    { id: "phuket", label: "Phuket", value: "phuket", icon: <Plane className="w-5 h-5 text-blue-500" />, category: "destination" },
    { id: "koh_tao", label: "Koh Tao", value: "koh_tao", icon: <Globe className="w-5 h-5 text-cyan-500" />, category: "destination" },
    { id: "koh_phangan", label: "Koh Phangan", value: "koh_phangan", icon: <Globe className="w-5 h-5 text-purple-500" />, category: "destination" },
    { id: "koh_samui", label: "Koh Samui", value: "koh_samui", icon: <Globe className="w-5 h-5 text-pink-500" />, category: "destination" },
    { id: "krabi", label: "Krabi", value: "krabi", icon: <MapPin className="w-5 h-5 text-red-500" />, category: "destination" },
    { id: "pattaya", label: "Pattaya", value: "pattaya", icon: <Building className="w-5 h-5 text-yellow-500" />, category: "destination" },
  ]

  const categories: NomadFeature[] = [
    { id: "coworking_spaces", label: "Co-Working Spaces/Offices", value: "coworking_spaces", icon: <BriefcaseBusiness className="w-5 h-5 text-purple-500" />, category: "category" },
    { id: "accommodation", label: "Accommodation", value: "accommodation", icon: <BedDouble className="w-5 h-5 text-blue-500" />, category: "category" },
    { id: "food_beverages", label: "Food & Beverages", value: "food_beverages", icon: <Utensils className="w-5 h-5 text-amber-700" />, category: "category" },
    { id: "activities", label: "Activities", value: "activities", icon: <Activity className="w-5 h-5 text-green-600" />, category: "category" },
  ]

  const featuresAmenities: NomadFeature[] = [
    { id: "collaboration_areas", label: "Collaboration Areas", value: "collaboration_areas", icon: <Users className="w-5 h-5 text-blue-500" />, category: "features_amenities" },
    { id: "lounge_areas", label: "Lounge Areas", value: "lounge_areas", icon: <Coffee className="w-5 h-5 text-amber-700" />, category: "features_amenities" },
    { id: "natural_lighting", label: "Natural Lighting", value: "natural_lighting", icon: <Lightbulb className="w-5 h-5 text-yellow-500" />, category: "features_amenities" },
    { id: "fast_wifi", label: "Fast Wi-Fi", value: "fast_wifi", icon: <Wifi className="w-5 h-5 text-blue-500" />, category: "features_amenities" },
    { id: "cctv_surveillance", label: "CCTV Surveillance", value: "cctv_surveillance", icon: <Camera className="w-5 h-5 text-gray-500" />, category: "features_amenities" },
    { id: "cleaning_services", label: "Cleaning Services", value: "cleaning_services", icon: <Sparkles className="w-5 h-5 text-pink-500" />, category: "features_amenities" },
    { id: "work_pods_cubicles", label: "Work Pods or Cubicles", value: "work_pods_cubicles", icon: <BriefcaseBusiness className="w-5 h-5 text-purple-500" />, category: "features_amenities" },
    { id: "standing_office_desks", label: "Standing Office Desks", value: "standing_office_desks", icon: <BriefcaseBusiness className="w-5 h-5 text-green-500" />, category: "features_amenities" },
    { id: "printing_scanning_services", label: "Printing & Scanning Services", value: "printing_scanning_services", icon: <BriefcaseBusiness className="w-5 h-5 text-indigo-500" />, category: "features_amenities" },
    { id: "air_conditioning", label: "Air conditioning", value: "air_conditioning", icon: <Globe className="w-5 h-5 text-cyan-500" />, category: "features_amenities" },
    { id: "heater", label: "Heater", value: "heater", icon: <Globe className="w-5 h-5 text-red-500" />, category: "features_amenities" },
    { id: "breakfast_available", label: "Breakfast Available", value: "breakfast_available", icon: <Soup className="w-5 h-5 text-orange-500" />, category: "features_amenities" },
    { id: "excellent_breakfast_included", label: "Excellent breakfast included", value: "excellent_breakfast_included", icon: <Soup className="w-5 h-5 text-lime-500" />, category: "features_amenities" },
    { id: "free_parking", label: "Free Parking", value: "free_parking", icon: <Car className="w-5 h-5 text-gray-500" />, category: "features_amenities" },
    { id: "business_centers", label: "Business Centers", value: "business_centers", icon: <BriefcaseBusiness className="w-5 h-5 text-blue-500" />, category: "features_amenities" },
    { id: "wellness", label: "Wellness (Fitness, Spa and Wellness Centre, Massage, Fitness Center)", value: "wellness", icon: <Dumbbell className="w-5 h-5 text-pink-500" />, category: "features_amenities" },
    { id: "free_shuttle_bus", label: "Free Shuttle Bus to nearby Public Transport", value: "free_shuttle_bus", icon: <Bus className="w-5 h-5 text-green-500" />, category: "features_amenities" },
    { id: "vegan_plant_base_menu", label: "Offer Vegan/Plant Base Menu", value: "vegan_plant_base_menu", icon: <Leaf className="w-5 h-5 text-lime-500" />, category: "features_amenities" },
    { id: "reusable_biodegradable_tableware", label: "Use Reusable or Biodegradable Tableware", value: "reusable_biodegradable_tableware", icon: <Leaf className="w-5 h-5 text-emerald-500" />, category: "features_amenities" },
    { id: "eco_conscious_group_activities", label: "Eco-Conscious Group Activities", value: "eco_conscious_group_activities", icon: <Leaf className="w-5 h-5 text-teal-500" />, category: "features_amenities" },
  ]

  // Handle filter selection
  const handleFilterSelect = (category: keyof MultiSelectFilters, value: string) => {
    const updatedFilters = {
      ...activeFilters,
      [category]: activeFilters[category].includes(value)
        ? activeFilters[category].filter((item: string) => item !== value)
        : [...activeFilters[category], value]
    };
    setActiveFilters(updatedFilters);
    onFilterChange?.(updatedFilters);
  };

  // Remove a specific filter
  const handleRemoveFilter = (category: keyof MultiSelectFilters, value: string) => {
    const updatedFilters = {
      ...activeFilters,
      [category]: activeFilters[category].filter((item: string) => item !== value)
    };
    setActiveFilters(updatedFilters);
    onFilterChange?.(updatedFilters);
  };

  // Handle search input change
const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch?.(value);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setActiveFilters({
      destination: [],
      category: [],
      features_amenities: [],
    });
    onFilterChange?.({
      destination: [],
      category: [],
      features_amenities: [],
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="relative">
        {/* Search Input */}
        <div className={cn(
          "flex items-center gap-2 w-full rounded-lg border bg-background px-3 py-2",
          isFocused && "ring-2 ring-ring"
        )}>
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search for listings..."
            className="flex-1 bg-transparent outline-none"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="absolute top-full left-0 w-full mt-2 p-4 bg-background border rounded-lg shadow-lg z-10">
            {/* Destinations */}
            <div className="space-y-4">
              <h3 className="font-semibold">Destinations</h3>
              <div className="flex flex-wrap gap-2">
                {destinations.map((dest) => (
                  <FilterBadge
                    variant="pill"
                    label={dest.label}
                    onRemove={
                      activeFilters.destination.includes(dest.value)
                        ? () => handleRemoveFilter('destination', dest.value)
                        : undefined
                    }
                    className={cn(
                      'cursor-pointer',
                      activeFilters.destination.includes(dest.value) && 'bg-primary/10'
                    )}
                    onClick={() => handleFilterSelect('destination', dest.value)}
                  >
                    {dest.icon}
                  </FilterBadge>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="mt-4 space-y-4">
              <h3 className="font-semibold">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <FilterBadge
                    variant="pill"
                    label={cat.label}
                    onRemove={
                      activeFilters.category.includes(cat.value)
                        ? () => handleRemoveFilter('category', cat.value)
                        : undefined
                    }
                    className={cn(
                      'cursor-pointer',
                      activeFilters.category.includes(cat.value) && 'bg-primary/10'
                    )}
                    onClick={() => handleFilterSelect('category', cat.value)}
                  >
                    {cat.icon}
                  </FilterBadge>
                ))}
              </div>
            </div>

            {/* Features & Amenities */}
            <div className="mt-4 space-y-4">
              <h3 className="font-semibold">Features & Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {featuresAmenities.map((feature) => (
                  <FilterBadge
                    variant="pill"
                    label={feature.label}
                    onRemove={
                      activeFilters.features_amenities.includes(feature.value)
                        ? () => handleRemoveFilter('features_amenities', feature.value)
                        : undefined
                    }
                    className={cn(
                      'cursor-pointer',
                      activeFilters.features_amenities.includes(feature.value) && 'bg-primary/10'
                    )}
                    onClick={() => handleFilterSelect('features_amenities', feature.value)}
                  >
                    {feature.icon}
                  </FilterBadge>
                ))}
              </div>
            </div>

            {/* Clear Filters Button */}
            {(activeFilters.destination.length > 0 ||
              activeFilters.category.length > 0 ||
              activeFilters.features_amenities.length > 0) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="mt-4"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

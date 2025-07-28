"use client"

import * as React from 'react';
import { Button } from "./Button"
import { X, Search, Filter, Globe, Building, Mountain, Plane, MapPin, BriefcaseBusiness, 
  BedDouble, Utensils, Activity, Users, Coffee, Lightbulb, Wifi, Camera, Sparkles, 
  Car, Dumbbell, Bus, Leaf, Soup, ChevronDown } from "lucide-react"
import { MotionConfig, motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

// Multi-select filter state type
interface MultiSelectFilters {
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

  // Fetch amenities (replace with real API call)
  React.useEffect(() => {
    // TODO: Replace with fetch('/api/amenities') or similar
    setAmenities([
      { _id: '1', name: 'Fast Wi-Fi', description: 'High-speed internet', badge: { asset: { url: '/wifi.png' } } },
      { _id: '2', name: 'Free Parking', badge: { asset: { url: '/parking.png' } } },
      { _id: '3', name: 'Air Conditioning' },
    ]);
  }, []);

  // Handler for selecting/deselecting amenities
  const handleAmenitySelect = (id: string) => {
    const updated = activeFilters.amenities.includes(id)
      ? activeFilters.amenities.filter(aid => aid !== id)
      : [...activeFilters.amenities, id];
    const newFilters = { ...activeFilters, amenities: updated };
    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  // ...existing code for features/handlers...
  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* ...existing code... */}
      {/* Amenities Filter */}
      <div className="mt-4 space-y-4">
        <h3 className="font-semibold">Amenities</h3>
        <div className="flex flex-wrap gap-2">
          {amenities.map((amenity) => (
            <FilterBadge
              key={amenity._id}
              variant="pill"
              label={amenity.name}
              onRemove={
                activeFilters.amenities.includes(amenity._id)
                  ? () => handleAmenitySelect(amenity._id)
                  : undefined
              }
              className={cn(
                'cursor-pointer',
                activeFilters.amenities.includes(amenity._id) && 'bg-primary/10'
              )}
              onClick={() => handleAmenitySelect(amenity._id)}
            >
              {amenity.badge?.asset?.url && (
                <img src={amenity.badge.asset.url} alt={amenity.name} className="w-5 h-5 rounded-full mr-2" />
              )}
              {amenity.name}
            </FilterBadge>
          ))}
        </div>
      </div>
      {/* ...existing code... */}
    </div>
  );
}

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
type MultiSelectFilters = {
  destination: string[];
  category: string[];
  nomadFeatures: string[];
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
    nomadFeatures: [],
  });
  const [isFocused, setIsFocused] = React.useState(false);
  const [showFilters, setShowFilters] = React.useState(false);

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

  // ...existing code for featuresAmenities, handlers, and rendering...
}

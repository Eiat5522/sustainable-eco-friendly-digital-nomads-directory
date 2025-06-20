"use client"

import { useState, useRef, useEffect, type ChangeEvent, type FormEvent } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AnimatePresence, motion, MotionConfig } from "framer-motion"
import { Search, X, Filter, Globe, Wifi, Coffee, Mountain, Plane, Users, ChevronDown, Building, Utensils, Activity, MapPin, BriefcaseBusiness, Lightbulb, Camera, Car, Bus, Leaf, Sparkles, Dumbbell, Soup, BedDouble } from "lucide-react"
import { RiCloseFill } from '@remixicon/react'
import { cn } from "@/lib/utils"

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
  ...props
}: FilterBadgeProps) => {
  return (
    <span className={cn(filterBadgeVariants({ variant }), className)} {...props}>
      {label}
      <span className="h-4 w-px bg-border" />
      <span className="font-medium text-foreground">
        {value}
      </span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className={cn(
            "-ml-1.5 flex size-5 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground",
            variant === "pill" ? "rounded-full" : "rounded"
          )}
          aria-label="Remove"
        >
          <RiCloseFill className="size-4 shrink-0" aria-hidden={true} />
        </button>
      )}
    </span>
  )
}

// Enhanced Select Component for Nomad Features
type NomadFeature = {
  id: string
  label: string
  value: string
  description?: string
  icon: React.ReactNode
  category: string
}

type NomadSelectProps = {
  data?: NomadFeature[]
  onChange?: (value: string) => void
  defaultValue?: string
  placeholder?: string
  selectedValue?: string; // Added prop to control selected value externally
}

const NomadSelect = ({ data, defaultValue, placeholder = "Select feature", onChange, selectedValue }: NomadSelectProps) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<NomadFeature | undefined>(undefined)

  useEffect(() => {
    if (selectedValue) {
      const item = data?.find((i) => i.value === selectedValue)
      if (item) {
        setSelected(item)
      } else {
        // If selectedValue is provided but not found in data, clear selection
        setSelected(undefined);
      }
    } else if (defaultValue) {
      const item = data?.find((i) => i.value === defaultValue)
      if (item) {
        setSelected(item)
      } else {
        // If defaultValue is provided but not found in data, clear selection
        setSelected(undefined);
      }
    } else {
      setSelected(undefined); // Clear selection if no default or selectedValue
    }
  }, [defaultValue, data, selectedValue]) // Added selectedValue to dependency array

  const onSelect = (value: string) => {
    const item = data?.find((i) => i.value === value)
    setSelected(item as NomadFeature)
    setOpen(false)
    onChange?.(value)
  }

  return (
    <MotionConfig
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
        ease: [0.65, 0, 0.35, 1], // Changed to array format
      }}
    >
      <motion.div className="flex items-center justify-center w-full">
        <AnimatePresence mode="popLayout">
          {!open ? (
            <motion.div
              whileTap={{ scale: 0.95 }}
              animate={{
                borderRadius: 12,
              }}
              layout
              layoutId="nomad-dropdown"
              onClick={() => setOpen(true)}
              className="overflow-hidden rounded-xl border border-input bg-background shadow-sm w-full cursor-pointer"
            >
              <NomadSelectItem item={selected} placeholder={placeholder} />
            </motion.div>
          ) : (
            <motion.div
              layout
              animate={{
                borderRadius: 16,
              }}
              layoutId="nomad-dropdown"
              className="overflow-hidden rounded-2xl w-full max-w-md border border-input bg-background py-2 shadow-lg z-50"
              ref={ref}
            >
              <NomadSelectHead setOpen={setOpen} />
              <div className="w-full overflow-y-auto max-h-64">
                {data?.map((item) => (
                  <NomadSelectItem
                    key={item.id}
                    item={item}
                    onChange={onSelect}
                    showDescription={true}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </MotionConfig>
  )
}

const NomadSelectHead = ({ setOpen }: { setOpen: (open: boolean) => void }) => {
  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
      }}
      transition={{
        delay: 0.1,
      }}
      layout
      className="flex items-center justify-between p-4"
    >
      <motion.strong layout className="text-foreground flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#479b8b]" />
        Choose Nomad Feature
      </motion.strong>
      <button
        onClick={() => setOpen(false)}
        className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary hover:bg-muted"
        aria-label="Close"
      >
        <X className="text-secondary-foreground" size={12} />
      </button>
    </motion.div>
  )
}

type NomadSelectItemProps = {
  item?: NomadFeature
  showDescription?: boolean
  onChange?: (value: string) => void
  placeholder?: string
}

const NomadSelectItem = ({
  item,
  showDescription = false,
  onChange,
  placeholder,
}: NomadSelectItemProps) => {
  return (
    <motion.div
      className={`group flex cursor-pointer items-center justify-between gap-2 p-4 py-3 hover:bg-accent hover:text-accent-foreground ${
        !showDescription && "!py-2"
      }`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      onClick={() => item && onChange?.(item.value)}
    >
      <div className="flex items-center gap-3 flex-1">
        <motion.div
          layout
          layoutId={`icon-${item?.id}`}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-input bg-muted"
        >
          {item?.icon || <Globe className="w-5 h-5" />}
        </motion.div>
        <motion.div layout className="flex flex-col flex-1">
          <motion.span
            layoutId={`label-${item?.id}`}
            className="text-sm font-semibold text-foreground"
          >
            {item?.label || placeholder}
          </motion.span>
          {showDescription && item?.description && (
            <span className="text-xs text-muted-foreground">
              {item.description}
            </span>
          )}
        </motion.div>
      </div>
      {!showDescription && (
        <motion.div
          layout
          className="flex items-center justify-center gap-2 pr-3"
        >
          <ChevronDown className="text-foreground" size={20} />
        </motion.div>
      )}
    </motion.div>
  )
}

// Main Search Filter Component
interface SearchFilterProps {
  onSearch?: (query: string) => void
  onFilterChange?: (filters: Record<string, string>) => void
}

export default function DigitalNomadSearchFilter({ onSearch, onFilterChange }: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const [isFocused, setIsFocused] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

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

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    onSearch?.(value)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      onSearch?.(searchQuery)
    }
  }

  const addFilter = (key: string, value: string) => {
    const newFilters = { ...activeFilters, [key]: value }
    setActiveFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  const removeFilter = (key: string) => {
    const newFilters = { ...activeFilters }
    delete newFilters[key]
    setActiveFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  const clearAllFilters = () => {
    setActiveFilters({})
    onFilterChange?.({})
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-6">
      {/* Search Bar */}
      <motion.form
        onSubmit={handleSubmit}
        className="relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className={cn(
            "flex items-center w-full rounded-2xl border relative overflow-hidden backdrop-blur-md transition-all duration-300",
                        isFocused
              ? "border-[#479b8b] shadow-lg shadow-[#479b8b]/20 bg-background"
              : "border-input bg-background/50"
          )}
          animate={{
            scale: isFocused ? 1.02 : 1,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <div className="pl-4 py-4">
            <Search
              size={20}
              className={cn(
                "transition-colors duration-300",
                                isFocused ? "text-[#479b8b]" : "text-muted-foreground"
              )}
            />
          </div>

          <input
            ref={inputRef}
            type="text"
            placeholder="Search digital nomad locations..."
            value={searchQuery}
            onChange={handleSearch}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full py-4 bg-transparent outline-none placeholder:text-muted-foreground font-medium text-base text-foreground"
          />

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 mr-2 rounded-xl transition-all duration-200",
                            showFilters
                ? "bg-[#479b8b]/10 text-[#479b8b] dark:bg-[#479b8b]/20 dark:text-[#479b8b]"
                : "bg-muted text-muted-foreground hover:bg-accent"
            )}
          >
            <Filter size={16} />
            <span className="text-sm font-medium">Filters</span>
            {Object.keys(activeFilters).length > 0 && (
                            <span className="bg-[#479b8b] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {Object.keys(activeFilters).length}
              </span>
            )}
          </button>
        </motion.div>
      </motion.form>

      {/* Active Filters */}
      <AnimatePresence>
        {Object.keys(activeFilters).length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap items-center gap-2"
          >
            <span className="text-sm font-medium text-muted-foreground">Active filters:</span>
            {Object.entries(activeFilters).map(([key, value]) => {
              const allData = [...destinations, ...categories, ...featuresAmenities];
              const feature = allData.find(f => f.value === value);
              return (
                <FilterBadge
                  key={key}
                  label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} // Format key for display
                  value={feature?.label || value}
                  variant="pill"
                  onRemove={() => removeFilter(key)}
                />
              )
            })}
            <button
              onClick={clearAllFilters}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Clear all
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6 bg-muted/50 rounded-2xl border"
          >
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-[#479b8b]" />
                Destination
              </h3>
              <NomadSelect
                data={destinations}
                placeholder="Select destination"
                onChange={(value) => addFilter("destination", value)}
                selectedValue={activeFilters["destination"]}
              />
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                                <Filter className="w-4 h-4 text-[#479b8b]" />
                Category
              </h3>
              <NomadSelect
                data={categories}
                placeholder="Select category"
                onChange={(value) => addFilter("category", value)}
                selectedValue={activeFilters["category"]}
              />
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[#479b8b]" />
                Features/Amenities
              </h3>
              <NomadSelect
                data={featuresAmenities}
                placeholder="Select feature/amenity"
                onChange={(value) => addFilter("feature_amenity", value)}
                selectedValue={activeFilters["feature_amenity"]}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Results Placeholder */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center py-12 text-muted-foreground"
      >
                <Globe className="w-12 h-12 mx-auto mb-4 text-[#479b8b]" />
        <p className="text-lg font-medium">Search for digital nomad friendly locations</p>
        <p className="text-sm">Find your next destination with the perfect amenities</p>
      </motion.div>
    </div>
  )
}

"use client";

import { useState, useEffect } from 'react'import type { LucideIcon } from 'lucide-react'
import { NeoBadge } from '@/components/ui/neo-badge'
import { Laptop, Coffee, Bed, UtensilsCrossed, Mountain } from 'lucide-react'
type Category = {
  id: string
  name: string
  count: number
  icon: LucideIcon
}

const categories = [
 { id: 'coworking', name: 'Coworking', count: 847, icon: Laptop },
  { id: 'cafe', name: 'Cafe', count: 1205, icon: Coffee },
  { id: 'accommodation', name: 'Accommodation', count: 623, icon: Bed },
  { id: 'restaurant', name: 'Restaurant', count: 934, icon: UtensilsCrossed },
  { id: 'activities', name: 'Activities', count: 412, icon: Mountain },
] as const satisfies ReadonlyArray<Category>

export function CategoryFilters({
  value,
  defaultValue = [],
  onChange,
  items,
}: {
  value?: string[]
  defaultValue?: string[]
  onChange?: (next: string[]) => void
  items?: ReadonlyArray<Category>
}) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(value ?? defaultValue)

  // keep internal state in sync when controlled
  useEffect(() => {
    if (value) setSelectedCategories(value)
  }, [value])

  {list.map((category) => {

  const toggleCategory = (categoryId: string) => {
    if (value) {
      const next = value.includes(categoryId)
        ? value.filter(id => id !== categoryId)
        : [...value, categoryId]
      onChange?.(next)
      return
    }
    setSelectedCategories(prev => {
      const next = prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
      onChange?.(next)
      return next
    })
  }

  return (
<section
      className="bg-background py-8 border-b-4 border-neo-border"
      aria-label="Filter by category"
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center gap-4">
          {list.map((category) => {
            const Icon = category.icon
            const isSelected = selectedCategories.includes(category.id)
            
            return (
              <button
                type="button"
                aria-pressed={isSelected}
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                className={`neo-button neo-button-hover flex items-center space-x-2 px-6 py-3 rounded-full transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary focus-visible:ring-offset-2 ${
                  isSelected 
                    ? 'bg-neo-primary text-white' 
                    : 'bg-neo-surface text-neo-text-primary hover:bg-neo-primary hover:text-white'
                }`}
              >
                <Icon size={18} />
                <span className="font-semibold">{category.name}</span>
                <NeoBadge 
                  variant={isSelected ? "outline" : "secondary"} 
                  size="sm"
                  className={isSelected ? "bg-white/20 text-white border-white/40" : ""}
                >
                  {category.count.toLocaleString()}
                </NeoBadge>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
"use client"

import React, { useState } from 'react'
import { NeoBadge } from '@/components/ui/neo-badge'
import { Laptop, Coffee, Bed, UtensilsCrossed, Mountain } from 'lucide-react'

const categories = [
  { id: 'coworking', name: 'Coworking', count: 847, icon: Laptop },
  { id: 'cafe', name: 'Cafe', count: 1205, icon: Coffee },
  { id: 'accommodation', name: 'Accommodation', count: 623, icon: Bed },
  { id: 'restaurant', name: 'Restaurant', count: 934, icon: UtensilsCrossed },
  { id: 'activities', name: 'Activities', count: 412, icon: Mountain },
]

export function CategoryFilters() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  return (
    <section className="bg-background py-8 border-b-4 border-neo-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center gap-4">
          {categories.map((category) => {
            const Icon = category.icon
            const isSelected = selectedCategories.includes(category.id)
            
            return (
              <button
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                className={`neo-button neo-button-hover flex items-center space-x-2 px-6 py-3 rounded-full transition-all duration-150 ${
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
                  {category.count}
                </NeoBadge>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
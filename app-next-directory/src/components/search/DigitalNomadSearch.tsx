'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { NeoInput } from '@/components/ui/neo-input'
import { NeoButton } from '@/components/ui/neo-button'

interface DigitalNomadSearchProps {
  placeholder?: string
  onSearch?: (query: string) => void
}

export function DigitalNomadSearch({ placeholder = 'Search listings...', onSearch }: DigitalNomadSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState<string>('')

  useEffect(() => {
    const q = searchParams.get('q') || ''
    setValue(q)
  }, [searchParams])

  const performSearch = useCallback((q: string) => {
    // Update query string and notify parent
    const params = new URLSearchParams(Array.from(searchParams.entries()))
    if (q) params.set('q', q)
    else params.delete('q')
    params.delete('page')
    router.push(`/search?${params.toString()}`)
    onSearch?.(q)
  }, [router, searchParams, onSearch])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch(value)
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-3 w-full" role="search" aria-label="Search listings">
      <NeoInput
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Search query"
        name="q"
      />
      <NeoButton type="submit" variant="primary">Search</NeoButton>
    </form>
  )
}

export default DigitalNomadSearch


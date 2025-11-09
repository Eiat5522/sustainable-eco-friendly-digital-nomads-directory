'use client'

import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DigitalNomadSearchFilter } from './DigitalNomadSearchFilter'
import type { FilterDefinition } from '@/hooks/useFilters'
import { NeoButton } from '@/components/ui/neo-button'
import { ListingCategory } from '@/types/enums'

type FiltersMap = Record<string, string[]>

type SpeechRecognitionConstructor = new () => SpeechRecognition

const CLEAR_COMMAND_PATTERNS = ['clear filters', 'reset filters', 'remove filters'] as const

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(value: string): string[] {
  return normalizeText(value).split(' ').filter(Boolean)
}

function createFiltersKey(filters: FiltersMap): string {
  const entries = Object.entries(filters)
    .map(([groupId, values]) => [groupId, [...new Set(values)].sort()])
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  return JSON.stringify(entries)
}

function normalizeFilters(filters: FiltersMap): FiltersMap {
  const normalized: FiltersMap = {}
  Object.entries(filters).forEach(([groupId, values]) => {
    const unique = Array.from(new Set(values.filter(Boolean)))
    if (unique.length) normalized[groupId] = unique
  })
  return normalized
}

function filterToAllowedValues(filters: FiltersMap, allowedByGroup: Map<string, Set<string>>): FiltersMap {
  const sanitized: FiltersMap = {}
  Object.entries(filters).forEach(([groupId, values]) => {
    const allowed = allowedByGroup.get(groupId)
    if (!allowed) return
    const unique = Array.from(new Set(values)).filter((value) => allowed.has(value))
    if (unique.length) sanitized[groupId] = unique
  })
  return sanitized
}

function collectTranscript(event: SpeechRecognitionEvent): string {
  const parts: string[] = []
  for (let i = event.resultIndex; i < event.results.length; i += 1) {
    const result = event.results[i]
    if (!result) continue
    for (let j = 0; j < result.length; j += 1) {
      const alternative = result[j]
      if (alternative?.transcript) parts.push(alternative.transcript)
    }
  }
  return parts.join(' ').trim()
}

function shouldClearFilters(normalizedTranscript: string, tokens: string[]): boolean {
  return (
    CLEAR_COMMAND_PATTERNS.some((command) => normalizedTranscript.includes(command)) ||
    (tokens.includes('clear') && tokens.includes('filters'))
  )
}

function candidateMatches(transcriptTokens: string[], normalizedTranscript: string, candidate: string): boolean {
  const normalizedCandidate = normalizeText(candidate)
  if (!normalizedCandidate) return false
  const candidateTokens = normalizedCandidate.split(' ')
  const everyTokenPresent = candidateTokens.every((token) => transcriptTokens.includes(token))
  if (everyTokenPresent) return true
  const normalizedTranscriptWithSpaces = normalizedTranscript.replace(/\s+/g, ' ')
  return normalizedTranscriptWithSpaces.includes(normalizedCandidate)
}

function extractFiltersFromTranscript(
  transcript: string,
  definitions: FilterDefinition[]
): FiltersMap {
  const normalizedTranscript = normalizeText(transcript)
  const tokens = tokenize(transcript)
  const matches: FiltersMap = {}

  definitions.forEach((definition) => {
    const optionMatches = new Set<string>()
    definition.options?.forEach((option) => {
      if (
        candidateMatches(tokens, normalizedTranscript, option.label) ||
        candidateMatches(tokens, normalizedTranscript, option.id)
      ) {
        optionMatches.add(option.id)
      }
    })
    if (optionMatches.size > 0) {
      matches[definition.id] = Array.from(optionMatches)
    }
  })

  return matches
}

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  if (window.SpeechRecognition && typeof window.SpeechRecognition === 'function') {
    return window.SpeechRecognition as SpeechRecognitionConstructor
  }
  if (window.webkitSpeechRecognition && typeof window.webkitSpeechRecognition === 'function') {
    return window.webkitSpeechRecognition as SpeechRecognitionConstructor
  }
  return null
}

const defaultDefinitions: FilterDefinition[] = [
  {
    id: 'category',
    label: 'Category',
    multiSelect: true,
    options: [
      { id: ListingCategory.COWORKING, label: 'Coworking' },
      { id: ListingCategory.CAFE, label: 'Cafe' },
      { id: ListingCategory.ACCOMMODATION, label: 'Accommodation' },
      { id: ListingCategory.RESTAURANT, label: 'Restaurant' },
      { id: ListingCategory.ACTIVITIES, label: 'Activities' },
    ],
  },
  {
    id: 'destination',
    label: 'Destination',
    multiSelect: true,
    options: [
      { id: 'Lisbon', label: 'Lisbon' },
      { id: 'Bali', label: 'Bali' },
      { id: 'Chiang Mai', label: 'Chiang Mai' },
    ],
  },
  {
    id: 'amenities',
    label: 'Amenities',
    multiSelect: true,
    options: [
      { id: 'wifi', label: 'Wi‑Fi' },
      { id: 'vegan', label: 'Vegan options' },
      { id: 'outdoor', label: 'Outdoor seating' },
    ],
  },
  {
    id: 'nomadFeatures',
    label: 'Nomad Features',
    multiSelect: true,
    options: [
      { id: 'fast-internet', label: 'Fast Internet' },
      { id: 'community', label: 'Community Events' },
    ],
  },
]

interface FiltersSidebarProps {
  definitions?: FilterDefinition[]
}

export function FiltersSidebar({ definitions = defaultDefinitions }: FiltersSidebarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const allowedByGroup = useMemo(
    () => new Map(definitions.map((d) => [d.id, new Set(d.options?.map((o) => o.id) ?? [])])),
    [definitions]
  )

  const initialFilters = useMemo(() => {
    const initial: FiltersMap = {}
    definitions.forEach((group) => {
      const allowed = allowedByGroup.get(group.id)
      const values = searchParams.getAll(group.id)
      const sanitized = allowed
        ? values.filter((value) => allowed.has(value))
        : values
      if (sanitized.length) {
        initial[group.id] = Array.from(new Set(sanitized))
      }
    })
    return initial
  }, [allowedByGroup, definitions, searchParams])

  const [controlledFilters, setControlledFilters] = useState<FiltersMap>(initialFilters)
  const [filtersKey, setFiltersKey] = useState(() => createFiltersKey(initialFilters))
  const filtersKeyRef = useRef(filtersKey)

  useEffect(() => {
    const nextKey = createFiltersKey(initialFilters)
    if (nextKey !== filtersKeyRef.current) {
      filtersKeyRef.current = nextKey
      setControlledFilters(initialFilters)
      setFiltersKey(nextKey)
    }
  }, [initialFilters])

  useEffect(() => {
    filtersKeyRef.current = filtersKey
  }, [filtersKey])

  const applyFilters = useCallback(
    (filters: FiltersMap) => {
      const normalized = normalizeFilters(filters)
      const nextKey = createFiltersKey(normalized)
      if (nextKey === filtersKeyRef.current) return

      filtersKeyRef.current = nextKey
      setControlledFilters(normalized)
      setFiltersKey(nextKey)

      const params = new URLSearchParams(Array.from(searchParams.entries()))
      definitions.forEach((group) => params.delete(group.id))
      Object.entries(normalized).forEach(([groupId, values]) => {
        values.forEach((value) => params.append(groupId, value))
      })
      params.delete('page')
      const query = params.toString()
      router.push(query ? `/search?${query}` : '/search')
    },
    [definitions, router, searchParams]
  )

  const handleChange = useCallback(
    (filters: FiltersMap) => {
      applyFilters(filters)
    },
    [applyFilters]
  )

  const speechRecognitionCtor = getSpeechRecognitionConstructor()
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [lastTranscript, setLastTranscript] = useState<string | null>(null)

  useEffect(() => () => {
    recognitionRef.current?.abort()
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  const startListening = useCallback(() => {
    if (!speechRecognitionCtor) return

    let recognition = recognitionRef.current
    if (!recognition) {
      recognition = new speechRecognitionCtor()
      recognition.lang = 'en-US'
      recognition.interimResults = false
      recognition.maxAlternatives = 3
      recognitionRef.current = recognition
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = collectTranscript(event)
      const normalizedTranscript = normalizeText(transcript)
      const tokens = tokenize(transcript)
      setLastTranscript(transcript || null)

      if (!normalizedTranscript) {
        setVoiceError('No speech detected. Please try again.')
        return
      }

      if (shouldClearFilters(normalizedTranscript, tokens)) {
        setVoiceError(null)
        applyFilters({})
        return
      }

      const recognized = extractFiltersFromTranscript(transcript, definitions)
      const sanitized = filterToAllowedValues(recognized, allowedByGroup)
      if (Object.keys(sanitized).length === 0) {
        setVoiceError('No matching filters detected. Try mentioning filter names like "category coworking".')
        return
      }

      setVoiceError(null)
      applyFilters(sanitized)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const message =
        event.error === 'not-allowed'
          ? 'Microphone access was denied.'
          : event.error === 'no-speech'
            ? 'No speech detected. Please try again.'
            : 'Voice recognition error. Please try again.'
      setVoiceError(message)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    try {
      recognition.start()
      setVoiceError(null)
      setLastTranscript(null)
      setIsListening(true)
    } catch (_error) {
      setVoiceError('Voice recognition is already running.')
    }
  }, [allowedByGroup, applyFilters, definitions, speechRecognitionCtor])

  const toggleListening = useCallback(() => {
    if (!speechRecognitionCtor) return
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, speechRecognitionCtor, startListening, stopListening])

  return (
    <div className="space-y-4">
      {speechRecognitionCtor ? (
        <section
          aria-live="polite"
          className="rounded-md border border-border bg-card p-4"
          data-testid="voice-filter-section"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h3 className="heading-sm">Voice filters</h3>
              <p className="text-sm text-muted-foreground">
                {isListening
                  ? 'Listening… mention filter names like "category coworking" or say "clear filters".'
                  : 'Use your voice to update filters. Try phrases like "category coworking" or "amenities Wi-Fi".'}
              </p>
            </div>
            <NeoButton
              type="button"
              variant={isListening ? 'accent' : 'secondary'}
              onClick={toggleListening}
              aria-pressed={isListening}
            >
              {isListening ? 'Stop voice input' : 'Use voice filters'}
            </NeoButton>
          </div>
          {lastTranscript ? (
            <p className="mt-2 text-sm text-muted-foreground" data-testid="voice-transcript">
              Heard: <span className="font-medium">{lastTranscript}</span>
            </p>
          ) : null}
          {voiceError ? (
            <p className="mt-2 text-sm text-destructive" role="alert" data-testid="voice-error">
              {voiceError}
            </p>
          ) : null}
        </section>
      ) : null}

      <DigitalNomadSearchFilter
        key={filtersKey}
        definitions={definitions}
        initialFilters={controlledFilters}
        onChange={handleChange}
        title="Filter Results"
      />
    </div>
  )
}

export default FiltersSidebar

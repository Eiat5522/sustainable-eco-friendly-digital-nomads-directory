import type { ListingSummaryDTO } from '@/types/dto'
import { z } from 'zod'

const tagSchema = z.union([z.string(), z.object({ name: z.string() })])

const apiItemSchema = z.object({
  _id: z.string().optional(),
  name: z.string().optional(),
  slug: z.union([z.string(), z.object({ current: z.string() })]).optional(),
  category: z.string().optional(),
  city: z
    .object({
      _id: z.string().optional(),
      name: z.string().optional(),
      slug: z.string().optional(),
      country: z.string().optional(),
    })
    .nullable()
    .optional(),
  location: z
    .object({
      _id: z.string().optional(),
      name: z.string().optional(),
      slug: z.string().optional(),
      country: z.string().optional(),
    })
    .nullable()
    .optional(),
  primaryImage: z
    .object({
      asset: z
        .object({
          url: z.string(),
        })
        .optional(),
    })
    .nullable()
    .optional(),
  shortDescription: z.string().nullable().optional(),
  amenityNames: z.array(z.string()).nullable().optional(),
  moderation: z.object({ featured: z.boolean().optional() }).optional(),
  ecoFocusTags: z.array(tagSchema).nullable().optional(),
  ecoFeatures: z.array(tagSchema).nullable().optional(),
  digitalNomadFeatures: z.array(tagSchema).nullable().optional(),
})

export function extractTagNames(
  list?: Array<z.infer<typeof tagSchema> | null | undefined> | null,
): string[] {
  if (!Array.isArray(list)) return []
  const tags: string[] = []
  for (const entry of list) {
    if (typeof entry === 'string') {
      const name = entry.trim()
      if (name.length > 0) tags.push(name)
      continue
    }
    if (entry && typeof entry === 'object' && typeof entry.name === 'string') {
      const name = entry.name.trim()
      if (name.length > 0) tags.push(name)
    }
  }
  return tags
}

export function mapResultToDTO(item: unknown): ListingSummaryDTO {
  const parseResult = apiItemSchema.safeParse(item)
  if (!parseResult.success) {
    console.error('Invalid API response shape:', parseResult.error)
    // Return a minimal valid DTO or throw with a user-friendly message
    throw new Error('Invalid search result data')
  }
  const validated = parseResult.data
  const city = validated.city ?? validated.location ?? null
  const imageUrl: string | undefined = validated?.primaryImage?.asset?.url ?? undefined
  const slugValue = validated.slug
  const slug: string = typeof slugValue === 'string' ? slugValue : slugValue?.current ?? ''
  const ecoFocusTags = extractTagNames(validated.ecoFocusTags ?? validated.ecoFeatures)
  const digitalNomadFeatures = extractTagNames(validated.digitalNomadFeatures)
  return {
    id: String(validated._id ?? slug ?? `temp-${Date.now()}-${Math.random()}`),
    name: String(validated.name ?? ''),
    slug,
    type: (validated.category ?? 'coworking') as ListingSummaryDTO['type'],
    city: city
      ? {
          id: String(city._id ?? ''),
          name: String(city.name ?? ''),
          slug: String(city.slug ?? ''),
          country: String(city.country ?? ''),
        }
      : null,
    imageUrl,
    shortDescription: validated.shortDescription ?? undefined,
    amenityNames: Array.isArray(validated.amenityNames) ? validated.amenityNames : undefined,
    featured: Boolean(validated.moderation?.featured === true),
    ecoFocusTags: ecoFocusTags.length > 0 ? ecoFocusTags : undefined,
    digitalNomadFeatures: digitalNomadFeatures.length > 0 ? digitalNomadFeatures : undefined,
  }
}

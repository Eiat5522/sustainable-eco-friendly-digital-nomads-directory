/**
 * Shared field definitions for Sanity schemas
 * Following composition pattern for reusability
 */

export const imageWithAlt = {
  type: 'image',
  options: {
    hotspot: true
  },
  fields: [
    {
      name: 'alt',
      title: 'Alternative Text',
      type: 'string',
      description: 'Important for SEO and accessibility',
      validation: Rule => Rule.required().error('Alternative text is required for accessibility')
    },
    {
      name: 'caption',
      title: 'Caption',
      type: 'string'
    }
  ]
}

export const slugField = {
  name: 'slug',
  title: 'Slug',
  type: 'slug',
  options: {
    source: 'name',
    maxLength: 96
  },
  validation: Rule => Rule.required()
}

export const dateTimeWithInitial = {
  name: 'createdAt',
  title: 'Created At',
  type: 'datetime',
  readOnly: true,
  initialValue: () => new Date().toISOString()
}

export const descriptionField = {
  name: 'description',
  title: 'Description',
  type: 'text',
  rows: 2,
  validation: Rule => Rule.max(500).warning('Keep descriptions concise and informative')
}

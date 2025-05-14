/**
 * Eco Tag schema for Sanity CMS
 * Represents sustainability features/tags for listings
 */
import { slugField, descriptionField, imageWithAlt } from './shared/fields'

export default {
  name: 'ecoTag',
  title: 'Eco Tag',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      ...slugField
    },
    {
      ...descriptionField,
      validation: Rule => Rule.required().max(200).error('A clear, concise description is required')
    },
    {
      name: 'icon',
      title: 'Icon',
      ...imageWithAlt
    }
  ],
  preview: {
    select: {
      title: 'name',
      media: 'icon'
    }
  }
}

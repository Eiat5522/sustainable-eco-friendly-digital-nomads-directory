/**
 * Nomad Feature schema for Sanity CMS
 * Represents digital nomad-friendly features for listings
 */
import { slugField, descriptionField, imageWithAlt } from './shared/fields'

export default {
  name: 'nomadFeature',
  title: 'Digital Nomad Feature',
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

/**
 * City schema for Sanity CMS
 */
import { imageWithAlt, slugField, descriptionField } from './shared/fields'

export default {
  name: 'city',
  title: 'City',
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
      rows: 3
    },
    {
      name: 'coordinates',
      title: 'Coordinates',
      type: 'geopoint',
      validation: Rule => Rule.required().error('City coordinates are required for mapping')
    },
    {
      name: 'image',
      title: 'City Image',
      ...imageWithAlt
    }
  ],
  preview: {
    select: {
      title: 'name',
      media: 'image'
    }
  }
}

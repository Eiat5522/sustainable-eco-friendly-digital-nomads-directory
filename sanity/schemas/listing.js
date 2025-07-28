import { defineField, defineType } from 'sanity'
import { imageWithAlt } from './fields'

export default defineType({
  name: 'listing',
  title: 'Listing',
  type: 'document',
  fields: [
    // ...existing code...
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: Rule => Rule.required(),
      options: {
        searchBoost: 2.0
      }
    }),
    // ...existing code...
    defineField({
      name: 'amenities',
      title: 'Amenities',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'amenity' }] }],
      description: 'Select one or more amenities for this listing. Not required.'
    }),
    // ...existing code...
  ]
});

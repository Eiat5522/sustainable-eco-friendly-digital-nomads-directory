// Search boost configuration schema
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'searchBoost',
  title: 'Search Boost Configuration',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Field Name',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'boost',
      title: 'Boost Value',
      type: 'number',
      initialValue: 1.0,
      validation: Rule => Rule.required().min(0).max(10)
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Explain why this field has this boost value'
    })
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'boost'
    }
  }
})

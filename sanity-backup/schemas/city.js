import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'city',
  title: 'City',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'City Name (e.g., Chiang Mai)',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'country',
      title: 'Country (e.g., Thailand)',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'A short description of the city, its eco-friendliness, and nomad appeal.',
    }),
    defineField({
      name: 'sustainabilityScore',
      title: 'Sustainability Score',
      type: 'number',
      description: 'Score out of 100.',
      validation: (Rule) => Rule.required().min(0).max(100),
    }),
    defineField({
      name: 'highlights',
      title: 'Eco Highlights',
      type: 'array',
      of: [{type: 'string'}],
      description: 'List key sustainability features or attractions.',
    }),
    defineField({
      name: 'mainImage',
      title: 'Main Image',
      type: 'image',
      options: {
        hotspot: true, // Enables image cropping/positioning
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative text',
          description: 'Important for SEO and accessibility.',
          validation: (Rule) => Rule.required(),
        },
      ],
      validation: (Rule) => Rule.required(),    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'country',
      media: 'mainImage',
    },
  },
})

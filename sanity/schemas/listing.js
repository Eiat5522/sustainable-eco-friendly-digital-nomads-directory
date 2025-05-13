/**
 * Listing schema for Sanity CMS
 * Based on data_schema.md for Sustainable Eco-Friendly Digital Nomads Directory
 */

export default {
  name: 'listing',
  title: 'Listing',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Coworking', value: 'coworking' },
          { title: 'Cafe', value: 'cafe' },
          { title: 'Accommodation', value: 'accommodation' }
        ]
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'city',
      title: 'City',
      type: 'reference',
      to: [{ type: 'city' }],
      validation: Rule => Rule.required()
    },
    {
      name: 'addressString',
      title: 'Address',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'coordinates',
      title: 'Coordinates',
      type: 'geopoint'
    },
    {
      name: 'descriptionShort',
      title: 'Short Description',
      type: 'text',
      rows: 2,
      validation: Rule => Rule.max(160).warning('Short descriptions work best')
    },
    {
      name: 'descriptionLong',
      title: 'Long Description',
      type: 'array',
      of: [{ type: 'block' }]
    },
    {
      name: 'ecoFocusTags',
      title: 'Eco Focus Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'ecoTag' }] }]
    },
    {
      name: 'ecoNotesDetailed',
      title: 'Detailed Eco Notes',
      type: 'text',
      rows: 5
    },
    {
      name: 'sourceUrls',
      title: 'Source URLs',
      type: 'array',
      of: [{ type: 'url' }]
    },
    {
      name: 'mainImage',
      title: 'Main Image',
      type: 'image',
      options: {
        hotspot: true
      },
      fields: [
        {
          name: 'alt',
          title: 'Alternative Text',
          type: 'string',
          description: 'Important for SEO and accessibility'
        },
        {
          name: 'caption',
          title: 'Caption',
          type: 'string'
        }
      ]
    },
    {
      name: 'galleryImages',
      title: 'Gallery Images',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {
            hotspot: true
          },
          fields: [
            {
              name: 'alt',
              title: 'Alternative Text',
              type: 'string',
              description: 'Important for SEO and accessibility'
            },
            {
              name: 'caption',
              title: 'Caption',
              type: 'string'
            }
          ]
        }
      ]
    },
    {
      name: 'digitalNomadFeatures',
      title: 'Digital Nomad Features',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'nomadFeature' }] }]
    },
    {
      name: 'lastVerifiedDate',
      title: 'Last Verified Date',
      type: 'date'
    },
    // Conditional fields based on category
    {
      name: 'coworkingDetails',
      title: 'Coworking Details',
      type: 'coworkingDetails',
      hidden: ({ document }) => document?.category !== 'coworking'
    },
    {
      name: 'cafeDetails',
      title: 'Cafe Details',
      type: 'cafeDetails',
      hidden: ({ document }) => document?.category !== 'cafe'
    },
    {
      name: 'accommodationDetails',
      title: 'Accommodation Details',
      type: 'accommodationDetails',
      hidden: ({ document }) => document?.category !== 'accommodation'
    }
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'city.name',
      media: 'mainImage'
    }
  }
}

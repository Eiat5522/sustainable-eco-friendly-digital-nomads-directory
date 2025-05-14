/**
 * Listing schema for Sanity CMS
 * Based on data_schema.md for Sustainable Eco-Friendly Digital Nomads Directory
 */
import { imageWithAlt, slugField } from './shared/fields'

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
      ...slugField
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',      options: {
        list: [
          { title: 'Coworking', value: 'coworking' },
          { title: 'Cafe', value: 'cafe' },
          { title: 'Accommodation', value: 'accommodation' },
          { title: 'Restaurant', value: 'restaurant' },
          { title: 'Activity', value: 'activity' }
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
      type: 'geopoint',
      validation: Rule => Rule.required().error('Coordinates are required')
    },
    {
      name: 'descriptionShort',
      title: 'Short Description',
      type: 'text',
      rows: 2,
      validation: Rule => Rule.required().max(160).warning('Short descriptions work best')
    },
    {
      name: 'descriptionLong',
      title: 'Long Description',
      type: 'array',
      of: [{ type: 'block' }],
      validation: Rule => Rule.required().min(1).error('A long description is required')
    },
    {
      name: 'ecoFocusTags',
      title: 'Eco Focus Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'ecoTag' }] }],
      validation: Rule => Rule.required().min(1).error('At least one eco focus tag is required')
    },
    {
      name: 'ecoNotesDetailed',
      title: 'Detailed Eco Notes',
      type: 'text',
      rows: 5,
      validation: Rule => Rule.max(1000).warning('Keep eco notes concise')
    },
    {
      name: 'sourceUrls',
      title: 'Source URLs',
      type: 'array',
      of: [{ type: 'url' }],
      validation: Rule => Rule.min(1).error('At least one source URL is required')
    },
    {
      name: 'mainImage',
      title: 'Main Image',
      ...imageWithAlt,
      validation: Rule => Rule.required().error('A main image is required')
    },
    {
      name: 'galleryImages',
      title: 'Gallery Images',
      type: 'array',
      of: [{
        ...imageWithAlt
      }],
      validation: Rule => Rule.required().min(1).error('At least one gallery image is required')
    },
    {
      name: 'digitalNomadFeatures',
      title: 'Digital Nomad Features',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'nomadFeature' }] }],
      validation: Rule => Rule.min(1).warning('Add at least one digital nomad feature if possible')
    },
    {
      name: 'lastVerifiedDate',
      title: 'Last Verified Date',
      type: 'date',
      validation: Rule => Rule.required().error('Last verified date is required')
    },
    {
      name: 'averageRating',
      title: 'Average Rating',
      type: 'number',
      description: 'Calculated average rating from approved reviews. Do not edit manually.',
      readOnly: true,
      initialValue: 0,
      validation: Rule => Rule.min(0).max(5)
    },
    {
      name: 'reviewCount',
      title: 'Review Count',
      type: 'number',
      description: 'Total number of approved reviews. Do not edit manually.',
      readOnly: true,
      initialValue: 0,
      validation: Rule => Rule.min(0)
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
    },    {
      name: 'accommodationDetails',
      title: 'Accommodation Details',
      type: 'accommodationDetails',
      hidden: ({ document }) => document?.category !== 'accommodation'
    },
    {
      name: 'restaurantDetails',
      title: 'Restaurant Details',
      type: 'restaurantDetails',
      hidden: ({ document }) => document?.category !== 'restaurant'
    },
    {
      name: 'activitiesDetails',
      title: 'Activities Details',
      type: 'activitiesDetails',
      hidden: ({ document }) => document?.category !== 'activity'
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

import { defineField, defineType } from 'sanity'
import { imageWithAlt } from './fields'

export default defineType({
  name: 'listing',
  title: 'Listing',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: Rule => Rule.required(),
      options: {
        searchBoost: 2.0
      }
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'city',
      title: 'City',
      type: 'reference',
      to: [{type: 'city'}],
    }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'Coworking Space', value: 'coworking' },
          { title: 'Cafe', value: 'cafe' },
          { title: 'Accommodation', value: 'accommodation' },
          { title: 'Restaurant', value: 'restaurant' },
          { title: 'Activities', value: 'activities' }
        ],
        layout: 'dropdown'
      },
      validation: rule => rule.required()
    }),
    defineField({
      name: 'address',
      title: 'Address',
      type: 'string',
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'geopoint',
      description: 'Geographical location (latitude & longitude) for map display',
    }),
    defineField({
      name: 'shortDescription',
      title: 'Short Description',
      type: 'string',
    }),
    defineField({
      name: 'longDescription',
      title: 'Long Description',
      type: 'text',
    }),
    defineField({
      name: 'ecoTags',
      title: 'Eco Tags',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'ecoTag'}]}],
    }),
    defineField({
      name: 'ecoNotesDetailed',
      title: 'Eco Notes Detailed',
      type: 'text',
    }),
    defineField({
      name: 'sourceUrls',
      title: 'Source URLs',
      type: 'array',
      of: [{type: 'url'}],
    }),
    defineField({
      name: 'primaryImage',
      title: 'Primary Image',
      ...imageWithAlt
    }),
    defineField({
      name: 'galleryImages',
      title: 'Gallery Images',
      type: 'array',
      of: [imageWithAlt],
    }),
    defineField({
      name: 'digitalNomadFeatures',
      title: 'Digital Nomad Features',
      type: 'array',
      of: [{type: 'string'}],
    }),
    defineField({
      name: 'lastVerifiedDate',
      title: 'Last Verified Date',
      type: 'date',
    }),
    defineField({
      name: 'coworkingDetails',
      title: 'Coworking Details',
      type: 'object',
      options: {
        collapsible: true,
        collapsed: true,
      },
      fields: [
        defineField({
          name: 'operatingHours',
          title: 'Operating Hours',
          type: 'string',
        }),
        defineField({
          name: 'pricingPlans',
          title: 'Pricing Plans',
          type: 'array',
          of: [{type: 'string'}],
        }),
        defineField({
          name: 'specificAmenitiesCoworking',
          title: 'Specific Amenities (Coworking)',
          type: 'array',
          of: [{type: 'string'}],
        }),
      ],
    }),
    defineField({
      name: 'cafeDetails',
      title: 'Cafe Details',
      type: 'object',
      options: {
        collapsible: true,
        collapsed: true,
      },
      fields: [
        defineField({
          name: 'operatingHours',
          title: 'Operating Hours',
          type: 'string',
        }),
        defineField({
          name: 'priceIndication',
          title: 'Price Indication',
          type: 'string',
        }),
        defineField({
          name: 'menuHighlightsCafe',
          title: 'Menu Highlights (Cafe)',
          type: 'array',
          of: [{type: 'string'}],
        }),
        defineField({
          name: 'wifiReliabilityNotes',
          title: 'WiFi Reliability Notes',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'accommodationDetails',
      title: 'Accommodation Details',
      type: 'object',
      options: {
        collapsible: true,
        collapsed: true,
      },
      fields: [
        defineField({
          name: 'accommodationType',
          title: 'Accommodation Type',
          type: 'string',
        }),
        defineField({
          name: 'pricePerNightThbRange',
          title: 'Price Per Night (THB Range)',
          type: 'string',
        }),
        defineField({
          name: 'roomTypesAvailable',
          title: 'Room Types Available',
          type: 'array',
          of: [{type: 'string'}],
        }),
        defineField({
          name: 'specificAmenitiesAccommodation',
          title: 'Specific Amenities (Accommodation)',
          type: 'array',
          of: [{type: 'string'}],
        }),
      ],
    }),
    defineField({
      name: 'reviews',
      title: 'Reviews',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'review'}]}],
    }),
    defineField({
      name: 'moderation',
      title: 'Moderation',
      type: 'object',
      options: {
        collapsible: true,
        collapsed: false,
      },
      fields: [
        {
          name: 'status',
          title: 'Status',
          type: 'string',
          options: {
            list: [
              {title: 'Draft', value: 'draft'},
              {title: 'Pending Review', value: 'pending'},
              {title: 'Published', value: 'published'},
              {title: 'Archived', value: 'archived'},
              {title: 'Flagged', value: 'flagged'},
            ]
          },
          initialValue: 'draft'
        },
        {
          name: 'featured',
          title: 'Featured Listing',
          type: 'boolean',
          initialValue: false
        },
        {
          name: 'verificationStatus',
          title: 'Verification Status',
          type: 'string',
          options: {
            list: [
              {title: 'Unverified', value: 'unverified'},
              {title: 'Verified', value: 'verified'},
              {title: 'Needs Verification', value: 'needs_verification'},
            ]
          },
          initialValue: 'unverified'
        },
        {
          name: 'moderatorNotes',
          title: 'Moderator Notes',
          type: 'text'
        }
      ]
    }),
    defineField({
      name: 'searchMetadata',
      title: 'Search Metadata',
      type: 'object',
      description: 'Additional information to improve search functionality',
      options: {
        collapsible: true,
        collapsed: true,
      },
      fields: [
        {
          name: 'keywords',
          title: 'Additional Keywords',
          type: 'array',
          of: [{type: 'string'}],
          description: 'Additional search terms that might not appear in other fields'
        },
        {
          name: 'boost',
          title: 'Search Result Boost',
          type: 'number',
          initialValue: 1.0,
          description: 'Boost factor for search results (1.0 is normal)'
        },
        {
          name: 'searchExcerpt',
          title: 'Search Result Excerpt',
          type: 'text',
          description: 'Custom excerpt for search results display'
        },
        {
          name: 'similarListings',
          title: 'Similar Listings',
          type: 'array',
          of: [{
            type: 'reference',
            to: [{type: 'listing'}]
          }],
          description: 'Manually curated list of similar listings'
        }
      ]
    }),
    defineField({
      name: 'ecoDetails',
      title: 'Eco Details',
      type: 'object',
      fields: [
        {
          name: 'description',
          title: 'Description',
          type: 'text',
        },
        {
          name: 'ecoTags',
          title: 'Eco Tags',
          type: 'array',
          of: [{ type: 'string' }],
        },
        {
          name: 'certifications',
          title: 'Certifications',
          type: 'array',
          of: [{ type: 'string' }],
        },
      ],
    }),
    defineField({
      name: 'moderationStatus',
      title: 'Moderation Status',
      type: 'string',
      options: {
        list: [
          { title: 'Pending', value: 'pending' },
          { title: 'Approved', value: 'approved' },
          { title: 'Rejected', value: 'rejected' }
        ],
        layout: 'dropdown'
      },
      initialValue: 'pending',
    }),
    defineField({
      name: 'verificationStatus',
      title: 'Verification Status',
      type: 'string',
      options: {
        list: [
          { title: 'Unverified', value: 'unverified' },
          { title: 'Verified', value: 'verified' }
        ],
        layout: 'dropdown'
      },
      initialValue: 'unverified',
    }),
  ],
})

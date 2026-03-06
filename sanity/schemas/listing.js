import { defineField, defineType } from 'sanity';

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
      options: { searchBoost: 2.0 },
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'owner',
      title: 'Owner',
      type: 'reference',
      to: [{ type: 'user' }],
      description: 'User who manages this listing.',
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
      name: 'city',
      title: 'City',
      type: 'reference',
      to: [{ type: 'city' }],
    }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      description: 'Legacy compatibility field. Category reference is canonical.',
      options: {
        list: [
          { title: 'Coworking Space', value: 'coworking' },
          { title: 'Cafe', value: 'cafe' },
          { title: 'Accommodation', value: 'accommodation' },
          { title: 'Restaurant', value: 'restaurant' },
          { title: 'Activities', value: 'activities' },
        ],
        layout: 'dropdown',
      },
      validation: rule => rule.required(),
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
      name: 'primaryImage',
      title: 'Primary Image',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'galleryImages',
      title: 'Gallery Images',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
    }),
    defineField({
      name: 'ecoFocusTags',
      title: 'Eco Focus Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'ecoTag' }] }],
    }),
    defineField({
      name: 'digitalNomadFeatures',
      title: 'Digital Nomad Features',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'nomadFeature' }] }],
    }),
    defineField({
      name: 'amenities',
      title: 'Amenities',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'amenity' }] }],
      description: 'Select one or more amenities for this listing. Not required.',
    }),
    defineField({
      name: 'priceRange',
      title: 'Price Range',
      type: 'string',
      options: {
        list: [
          { title: 'Budget', value: 'budget' },
          { title: 'Moderate', value: 'moderate' },
          { title: 'Premium', value: 'premium' },
        ],
      },
    }),
    defineField({
      name: 'contactPhone',
      title: 'Contact Phone',
      type: 'string',
    }),
    defineField({
      name: 'contactEmail',
      title: 'Contact Email',
      type: 'string',
    }),
    defineField({
      name: 'website',
      title: 'Website',
      type: 'url',
    }),
    defineField({
      name: 'accommodationDetails',
      title: 'Accommodation Details',
      type: 'accommodationDetails',
      hidden: ({ parent }) => parent?.type !== 'accommodation',
      validation: Rule =>
        Rule.custom((value, context) => {
          if (context.parent?.type === 'accommodation' && !value) {
            return 'Accommodation details are required for accommodation listings';
          }
          return true;
        }),
    }),
    defineField({
      name: 'activitiesDetails',
      title: 'Activities Details',
      type: 'activitiesDetails',
      hidden: ({ parent }) => parent?.type !== 'activities',
      validation: Rule =>
        Rule.custom((value, context) => {
          if (context.parent?.type === 'activities' && !value) {
            return 'Activity details are required for activity listings';
          }
          return true;
        }),
    }),
    defineField({
      name: 'cafeDetails',
      title: 'Cafe Details',
      type: 'cafeDetails',
      hidden: ({ parent }) => parent?.type !== 'cafe',
      validation: Rule =>
        Rule.custom((value, context) => {
          if (context.parent?.type === 'cafe' && !value) {
            return 'Cafe details are required for cafe listings';
          }
          return true;
        }),
    }),
    defineField({
      name: 'coworkingDetails',
      title: 'Coworking Details',
      type: 'coworkingDetails',
      hidden: ({ parent }) => parent?.type !== 'coworking',
      validation: Rule =>
        Rule.custom((value, context) => {
          if (context.parent?.type === 'coworking' && !value) {
            return 'Coworking details are required for coworking spaces';
          }
          return true;
        }),
    }),
    defineField({
      name: 'restaurantDetails',
      title: 'Restaurant Details',
      type: 'restaurantDetails',
      hidden: ({ parent }) => parent?.type !== 'restaurant',
      validation: Rule =>
        Rule.custom((value, context) => {
          if (context.parent?.type === 'restaurant' && !value) {
            return 'Restaurant details are required for restaurant listings';
          }
          return true;
        }),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }],
      description: 'Canonical category reference used by categories pages and filtering.',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'reviews',
      title: 'Reviews',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'review' }] }],
    }),
    defineField({
      name: 'moderation',
      title: 'Moderation',
      type: 'object',
      options: { collapsible: true, collapsed: false },
      fields: [
        {
          name: 'status',
          title: 'Status',
          type: 'string',
          options: {
            list: [
              { title: 'Draft', value: 'draft' },
              { title: 'Pending Review', value: 'pending' },
              { title: 'Published', value: 'published' },
              { title: 'Archived', value: 'archived' },
              { title: 'Flagged', value: 'flagged' },
            ],
          },
          initialValue: 'draft',
        },
        { name: 'featured', title: 'Featured Listing', type: 'boolean', initialValue: false },
        {
          name: 'verificationStatus',
          title: 'Verification Status',
          type: 'string',
          options: {
            list: [
              { title: 'Unverified', value: 'unverified' },
              { title: 'Verified', value: 'verified' },
              { title: 'Needs Verification', value: 'needs_verification' },
            ],
          },
          initialValue: 'unverified',
        },
        { name: 'moderatorNotes', title: 'Moderator Notes', type: 'text' },
      ],
    }),
  ],
});

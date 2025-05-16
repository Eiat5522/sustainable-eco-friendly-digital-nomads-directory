import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'listing',
  title: 'Listing',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
    }),
    defineField({
      name: 'city',
      title: 'City',
      type: 'reference',
      to: [{type: 'city'}],
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
    }),
    defineField({
      name: 'address_string',
      title: 'Address',
      type: 'string',
    }),
    defineField({
      name: 'coordinates',
      title: 'Coordinates',
      type: 'geopoint',
    }),
    defineField({
      name: 'description_short',
      title: 'Short Description',
      type: 'string',
    }),
    defineField({
      name: 'description_long',
      title: 'Long Description',
      type: 'text',
    }),
    defineField({
      name: 'eco_focus_tags',
      title: 'Eco Focus Tags',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'ecoTag'}]}],
    }),
    defineField({
      name: 'eco_notes_detailed',
      title: 'Eco Notes Detailed',
      type: 'text',
    }),
    defineField({
      name: 'source_urls',
      title: 'Source URLs',
      type: 'array',
      of: [{type: 'url'}],
    }),
    defineField({
      name: 'primary_image_url',
      title: 'Primary Image URL',
      type: 'url',
    }),
    defineField({
      name: 'gallery_image_urls',
      title: 'Gallery Image URLs',
      type: 'array',
      of: [{type: 'url'}],
    }),
    defineField({
      name: 'digital_nomad_features',
      title: 'Digital Nomad Features',
      type: 'array',
      of: [{type: 'string'}],
    }),
    defineField({
      name: 'last_verified_date',
      title: 'Last Verified Date',
      type: 'date',
    }),
    defineField({
      name: 'coworking_details',
      title: 'Coworking Details',
      type: 'object',
      options: {
        collapsible: true,
        collapsed: true,
      },
      fields: [
        defineField({
          name: 'operating_hours',
          title: 'Operating Hours',
          type: 'string',
        }),
        defineField({
          name: 'pricing_plans',
          title: 'Pricing Plans',
          type: 'array',
          of: [{type: 'string'}],
        }),
        defineField({
          name: 'specific_amenities_coworking',
          title: 'Specific Amenities (Coworking)',
          type: 'array',
          of: [{type: 'string'}],
        }),
      ],
    }),
    defineField({
      name: 'cafe_details',
      title: 'Cafe Details',
      type: 'object',
      options: {
        collapsible: true,
        collapsed: true,
      },
      fields: [
        defineField({
          name: 'operating_hours',
          title: 'Operating Hours',
          type: 'string',
        }),
        defineField({
          name: 'price_indication',
          title: 'Price Indication',
          type: 'string',
        }),
        defineField({
          name: 'menu_highlights_cafe',
          title: 'Menu Highlights (Cafe)',
          type: 'array',
          of: [{type: 'string'}],
        }),
        defineField({
          name: 'wifi_reliability_notes',
          title: 'WiFi Reliability Notes',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'accommodation_details',
      title: 'Accommodation Details',
      type: 'object',
      options: {
        collapsible: true,
        collapsed: true,
      },
      fields: [
        defineField({
          name: 'accommodation_type',
          title: 'Accommodation Type',
          type: 'string',
        }),
        defineField({
          name: 'price_per_night_thb_range',
          title: 'Price Per Night (THB Range)',
          type: 'string',
        }),
        defineField({
          name: 'room_types_available',
          title: 'Room Types Available',
          type: 'array',
          of: [{type: 'string'}],
        }),
        defineField({
          name: 'specific_amenities_accommodation',
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
  ],
})

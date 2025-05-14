/**
 * Accommodation Details schema for Sanity CMS
 * Used as an object type within the listing schema
 */

export default {
  name: 'accommodationDetails',
  title: 'Accommodation Details',
  type: 'object',
  validation: Rule => Rule.required().error('Accommodation details are required for accommodation listings'),
  fields: [
    {
      name: 'accommodationType',
      title: 'Accommodation Type',
      type: 'string',
      options: {
        list: [
          { title: 'Hotel', value: 'hotel' },
          { title: 'Guesthouse', value: 'guesthouse' },
          { title: 'Bungalow', value: 'bungalow' },
          { title: 'Resort', value: 'resort' },
          { title: 'Hostel', value: 'hostel' },
          { title: 'Apartment/Condo', value: 'apartment_condo' },
          { title: 'Villa', value: 'villa' },
          { title: 'Eco Lodge', value: 'eco_lodge' }
        ]
      },
      validation: Rule => Rule.required().error('Accommodation type is required')
    },
    {
      name: 'priceRangeThb',
      title: 'Price Range (THB)',
      type: 'object',
      fields: [
        {
          name: 'min',
          title: 'Minimum Price',
          type: 'number',
          validation: Rule => Rule.required().min(0).error('Minimum price must be non-negative')
        },
        {
          name: 'max',
          title: 'Maximum Price',
          type: 'number',
          validation: Rule => Rule.required().min(0).error('Maximum price must be non-negative')
        }
      ],
      validation: Rule => Rule.custom((priceRange, context) => {
        if (priceRange?.max < priceRange?.min) {
          return 'Maximum price must be greater than minimum price'
        }
        return true
      })
    },
    {
      name: 'roomTypesAvailable',
      title: 'Room Types Available',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'type',
              title: 'Room Type',
              type: 'string',
              options: {
                list: [
                  { title: 'Single Room', value: 'single' },
                  { title: 'Double Room', value: 'double' },
                  { title: 'Twin Room', value: 'twin' },
                  { title: 'Studio', value: 'studio' },
                  { title: 'One Bedroom', value: 'one_bedroom' },
                  { title: 'Two Bedroom', value: 'two_bedroom' },
                  { title: 'Dormitory', value: 'dormitory' },
                  { title: 'Suite', value: 'suite' }
                ]
              },
              validation: Rule => Rule.required()
            },
            {
              name: 'pricePerNight',
              title: 'Price per Night (THB)',
              type: 'number',
              validation: Rule => Rule.required().min(0)
            },
            {
              name: 'features',
              title: 'Room Features',
              type: 'array',
              of: [{ type: 'string' }],
              options: {
                list: [
                  { title: 'Air Conditioning', value: 'ac' },
                  { title: 'Private Bathroom', value: 'private_bathroom' },
                  { title: 'Kitchen', value: 'kitchen' },
                  { title: 'Workspace', value: 'workspace' },
                  { title: 'Balcony', value: 'balcony' }
                ]
              }
            }
          ]
        }
      ],
      validation: Rule => Rule.required().min(1).error('At least one room type is required')
    },
    {
      name: 'minimumStay',
      title: 'Minimum Stay (nights)',
      type: 'number',
      validation: Rule => Rule.required().min(1).error('Please specify minimum stay duration')
    },
    {
      name: 'workspaceFeatures',
      title: 'Workspace Features',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Desk in Room', value: 'desk_in_room' },
          { title: 'Ergonomic Chair', value: 'ergonomic_chair' },
          { title: 'Good Lighting', value: 'good_lighting' },
          { title: 'Fast WiFi in Room', value: 'fast_wifi_room' },
          { title: 'Coworking Space', value: 'coworking_space' },
          { title: 'Multiple Power Outlets', value: 'power_outlets' }
        ]
      },
      validation: Rule => Rule.min(1).error('Please specify workspace features')
    }
  ]
}

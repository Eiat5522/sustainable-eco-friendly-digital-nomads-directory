/**
 * Accommodation Details schema for Sanity CMS
 * Used as an object type within the listing schema
 */

export default {
  name: 'accommodationDetails',
  title: 'Accommodation Details',
  type: 'object',
  validation: Rule =>
    Rule.required().error('Accommodation details are required for accommodation listings'),
  fields: [
    // Accommodation type (required, radio)
    {
      name: 'accommodationType',
      title: 'Accommodation Type',
      type: 'string',
      options: {
        list: [
          { title: '🏨 Hotel', value: 'hotel', description: 'Full-service hotel' },
          { title: '🏡 Guesthouse', value: 'guesthouse', description: 'Local, homey atmosphere' },
          { title: '🌴 Bungalow', value: 'bungalow', description: 'Individual units' },
          { title: '🏖️ Resort', value: 'resort', description: 'Full amenities resort' },
          { title: '🎒 Hostel', value: 'hostel', description: 'Budget-friendly, social' },
          {
            title: '🏢 Apartment/Condo',
            value: 'apartment_condo',
            description: 'Self-contained unit',
          },
          { title: '🏰 Villa', value: 'villa', description: 'Luxury private residence' },
          { title: '🌿 Eco Lodge', value: 'eco_lodge', description: 'Environmentally focused' },
        ],
        layout: 'radio',
      },
      validation: Rule => Rule.required(),
    },
    // Price per night (min/max)
    {
      name: 'pricePerNightThb',
      title: 'Price Per Night (THB)',
      type: 'object',
      fields: [
        { name: 'min', type: 'number', validation: Rule => Rule.required().min(0) },
        { name: 'max', type: 'number', validation: Rule => Rule.required().min(0) },
      ],
    },
    // Opening hours (optional)
    {
      name: 'openingHours',
      title: 'Opening Hours',
      type: 'array',
      of: [{ type: 'openingHoursEntry' }],
    },
    // Room types available (at least one required)
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
                  { title: 'Suite', value: 'suite' },
                ],
              },
              validation: Rule => Rule.required(),
            },
            {
              name: 'pricePerNight',
              title: 'Price per Night (THB)',
              type: 'number',
              validation: Rule => Rule.required().min(0),
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
                  { title: 'Balcony', value: 'balcony' },
                ],
              },
            },
          ],
        },
      ],
      validation: Rule => Rule.required().min(1).error('At least one room type is required'),
    },
    // Minimum stay (nights)
    {
      name: 'minimumStay',
      title: 'Minimum Stay (nights)',
      type: 'number',
      validation: Rule => Rule.required().min(1).error('Please specify minimum stay duration'),
    },
    // Coworking partnership (optional)
    {
      name: 'coworkingPartnership',
      title: 'Coworking Partnership',
      type: 'object',
      fields: [
        {
          name: 'hasPartnership',
          title: 'Has Coworking Partnership',
          type: 'boolean',
        },
        {
          name: 'partner',
          title: 'Partner Space',
          type: 'reference',
          to: [{ type: 'listing' }],
          options: {
            filter: 'category == "coworking"',
          },
          hidden: ({ parent }) => !parent?.hasPartnership,
        },
        {
          name: 'discountDetails',
          title: 'Discount Details',
          type: 'text',
          rows: 2,
          hidden: ({ parent }) => !parent?.hasPartnership,
        },
      ],
    },
    // Workspace quality (optional)
    {
      name: 'workspaceQuality',
      title: 'Workspace Quality',
      type: 'object',
      fields: [
        {
          name: 'hasWorkspace',
          title: 'Has Dedicated Workspace',
          type: 'boolean',
        },
        {
          name: 'workspaceType',
          title: 'Workspace Type',
          type: 'string',
          options: {
            list: [
              { title: 'Proper Desk', value: 'proper_desk' },
              { title: 'Ergonomic Setup', value: 'ergonomic' },
              { title: 'Basic Table', value: 'basic' },
              { title: 'Shared Space', value: 'shared' },
            ],
          },
          hidden: ({ parent }) => !parent?.hasWorkspace,
        },
        {
          name: 'workspaceFeatures',
          title: 'Workspace Features',
          type: 'array',
          of: [{ type: 'string' }],
          options: {
            list: [
              { title: 'Ergonomic Chair', value: 'ergonomic_chair' },
              { title: 'Desk Lamp', value: 'desk_lamp' },
              { title: 'Monitor', value: 'monitor' },
              { title: 'Natural Light', value: 'natural_light' },
            ],
          },
          hidden: ({ parent }) => !parent?.hasWorkspace,
        },
      ],
    },
    // Stay duration (min/max/long-term)
    {
      name: 'stayDuration',
      title: 'Stay Duration',
      type: 'object',
      fields: [
        {
          name: 'minimumNights',
          title: 'Minimum Nights',
          type: 'number',
          validation: Rule => Rule.required().min(1),
        },
        {
          name: 'maximumNights',
          title: 'Maximum Nights',
          type: 'number',
          validation: Rule => Rule.min(1),
        },
        {
          name: 'longTermAvailable',
          title: 'Long-term Stay Available',
          type: 'boolean',
        },
        {
          name: 'longTermDiscount',
          title: 'Long-term Stay Discount',
          type: 'text',
          rows: 2,
          hidden: ({ parent }) => !parent?.longTermAvailable,
        },
      ],
    },
  ],
};

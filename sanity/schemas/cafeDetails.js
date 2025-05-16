/**
 * Cafe Details schema for Sanity CMS
 * Used as an object type within the listing schema
 */

export default {
  name: 'cafeDetails',
  title: 'Cafe Details',
  type: 'object',
  validation: Rule => Rule.required().error('Cafe details are required for cafe listings'),
  fields: [    {
      name: 'operatingHours',
      title: 'Operating Hours',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          {
            name: 'day',
            title: 'Day',
            type: 'string',
            options: {
              list: [
                { title: 'Monday', value: 'monday' },
                { title: 'Tuesday', value: 'tuesday' },
                { title: 'Wednesday', value: 'wednesday' },
                { title: 'Thursday', value: 'thursday' },
                { title: 'Friday', value: 'friday' },
                { title: 'Saturday', value: 'saturday' },
                { title: 'Sunday', value: 'sunday' }
              ]
            }
          },
          {
            name: 'openTime',
            title: 'Opening Time',
            type: 'string',
            options: {
              list: Array.from({ length: 24 }, (_, i) => {
                const hour = i.toString().padStart(2, '0')
                return { title: `${hour}:00`, value: `${hour}:00` }
              })
            }
          },
          {
            name: 'closeTime',
            title: 'Closing Time',
            type: 'string',
            options: {
              list: Array.from({ length: 24 }, (_, i) => {
                const hour = i.toString().padStart(2, '0')
                return { title: `${hour}:00`, value: `${hour}:00` }
              })
            }
          },
          {
            name: 'closed',
            title: 'Closed',
            type: 'boolean',
            initialValue: false
          }
        ]
      }],
      validation: Rule => Rule.required().min(7).max(7).error('Please specify hours for all days of the week')
    },
    {
      name: 'priceIndication',
      title: 'Price Indication',
      type: 'string',
      options: {
        list: [
          { title: '$', value: '$' },
          { title: '$$', value: '$$' },
          { title: '$$$', value: '$$$' },
          { title: '$$$$', value: '$$$$' }
        ]
      },
      validation: Rule => Rule.required().error('Price indication is required')
    },
    {
      name: 'menuHighlights',
      title: 'Menu Highlights',
      type: 'array',
      of: [
        {
          type: 'string',
          options: {
            list: [
              { title: 'Specialty Coffee Beans', value: 'specialty_coffee_beans' },
              { title: 'Sourdough Bread/Pastries', value: 'sourdough_bread_pastries' },
              { title: 'Extensive Vegan Options', value: 'extensive_vegan_options' },
              { title: 'Fresh Pressed Juices/Smoothies', value: 'fresh_pressed_juices_smoothies' },
              { title: 'Brunch Menu', value: 'brunch_menu' },
              { title: 'Local Thai Dishes', value: 'local_thai_dishes' },
              { title: 'Craft Beer/Wine', value: 'craft_beer_wine' },
              { title: 'Organic Ingredients', value: 'organic_ingredients' },
              { title: 'Gluten-Free Options', value: 'gluten_free_options' },
              { title: 'Plant-Based Menu', value: 'plant_based_menu' }
            ]
          }
        }
      ],
      validation: Rule => Rule.min(2).error('Please select at least 2 menu highlights')
    },
    {
      name: 'workspaceAmenities',
      title: 'Workspace Amenities',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Fast WiFi', value: 'fast_wifi' },
          { title: 'Power Outlets', value: 'power_outlets' },
          { title: 'Large Tables', value: 'large_tables' },
          { title: 'Quiet Zones', value: 'quiet_zones' },
          { title: 'Outdoor Seating', value: 'outdoor_seating' }
        ]
      },
      validation: Rule => Rule.min(1).error('Please specify workspace amenities')
    },
    {
      name: 'maxRecommendedStay',
      title: 'Maximum Recommended Stay (hours)',
      type: 'number',
      validation: Rule => Rule.required().min(1).max(12)
        .error('Please specify a reasonable maximum stay duration between 1-12 hours')
    },
    {
      name: 'noiseLevel',
      title: 'Typical Noise Level',
      type: 'string',
      options: {
        list: [
          { title: 'Very Quiet', value: 'very_quiet' },
          { title: 'Low Hum', value: 'low' },
          { title: 'Moderate', value: 'moderate' },
          { title: 'Energetic', value: 'high' },
          { title: 'Very Loud', value: 'very_loud' }
        ]
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'powerOutlets',
      title: 'Power Outlet Availability',
      type: 'object',
      fields: [
        {
          name: 'availability',
          title: 'Availability',
          type: 'string',
          options: {
            list: [
              { title: 'Abundant (Every Table)', value: 'abundant' },
              { title: 'Good (Most Tables)', value: 'good' },
              { title: 'Limited (Some Tables)', value: 'limited' },
              { title: 'Very Limited', value: 'very_limited' },
              { title: 'None', value: 'none' }
            ]
          }
        },
        {
          name: 'notes',
          title: 'Notes',
          type: 'text',
          rows: 2
        }
      ]
    },
    {
      name: 'workPolicy',
      title: 'Work Policy',
      type: 'object',
      fields: [
        {
          name: 'laptopsAllowed',
          title: 'Laptops Allowed',
          type: 'boolean'
        },
        {
          name: 'timeLimit',
          title: 'Time Limit (minutes)',
          type: 'number',
          validation: Rule => Rule.min(0)
        },
        {
          name: 'peakHoursPolicy',
          title: 'Peak Hours Policy',
          type: 'string',
          options: {
            list: [
              { title: 'Always Welcome', value: 'always' },
              { title: 'Limited During Peak', value: 'limited_peak' },
              { title: 'Not Allowed During Peak', value: 'no_peak' }
            ]
          }
        },
        {
          name: 'peakHours',
          title: 'Peak Hours',
          type: 'string'
        }
      ]
    },
    {
      name: 'veganFriendly',
      title: 'Vegan Friendly',
      type: 'object',
      fields: [
        {
          name: 'isVeganFriendly',
          title: 'Is Vegan Friendly',
          type: 'boolean'
        },
        {
          name: 'veganOptions',
          title: 'Percentage of Vegan Options',
          type: 'number',
          validation: Rule => Rule.min(0).max(100)
        }
      ]
    }
  ]
}

/**
 * Restaurant Details schema for Sanity CMS
 * Used as an object type within the listing schema
 */

export default {
  name: 'restaurantDetails',
  title: 'Restaurant Details',
  type: 'object',
  validation: Rule => Rule.required().error('Restaurant details are required for restaurant listings'),
  fields: [
    {      name: 'cuisineType',
      title: 'Cuisine Type',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: '🇹🇭 Thai', value: 'thai', description: 'Traditional Thai cuisine' },
          { title: '🌍 International', value: 'international', description: 'Global fusion' },
          { title: '🥬 Vegan/Vegetarian', value: 'vegan_vegetarian', description: 'Plant-based options' },
          { title: '🫒 Mediterranean', value: 'mediterranean', description: 'Mediterranean diet' },
          { title: '🍱 Japanese', value: 'japanese', description: 'Japanese cuisine' },
          { title: '🍛 Indian', value: 'indian', description: 'Indian dishes' },
          { title: '🔄 Fusion', value: 'fusion', description: 'Creative fusion' },
          { title: '🌱 Raw/Health', value: 'raw_health', description: 'Raw and health food' },
          { title: '🥘 Local Fusion', value: 'local_fusion', description: 'Local with a twist' },
          { title: '🥗 Clean Eating', value: 'clean_eating', description: 'Healthy focus' }
        ],
        layout: 'grid'
      },
          { title: 'Raw/Health Food', value: 'raw_health' }
        ]
      },
      validation: Rule => Rule.required().min(1).error('Please specify at least one cuisine type')
    },
    {      name: 'priceRange',
      title: 'Price Range',
      type: 'string',
      options: {
        list: [
          { title: '$ (Under $10)', value: 'budget', description: 'Budget-friendly options' },
          { title: '$$ ($10-25)', value: 'moderate', description: 'Moderately priced' },
          { title: '$$$ ($25-50)', value: 'expensive', description: 'Higher-end dining' },
          { title: '$$$$ ($50+)', value: 'luxury', description: 'Premium dining experience' }
        ],
        layout: 'radio'
      },
      validation: Rule => Rule.required().error('Price range is required')
    },
    {
      name: 'operatingHours',
      title: 'Operating Hours',
      type: 'string',
      validation: Rule => Rule.required().error('Operating hours are required')
    },
    {
      name: 'sustainabilityInitiatives',
      title: 'Sustainability Initiatives',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Local Sourcing', value: 'local_sourcing' },
          { title: 'Organic Ingredients', value: 'organic_ingredients' },
          { title: 'Zero Waste Practices', value: 'zero_waste' },
          { title: 'Composting', value: 'composting' },
          { title: 'Plastic-Free', value: 'plastic_free' },
          { title: 'Food Waste Reduction', value: 'food_waste_reduction' },
          { title: 'Sustainable Seafood', value: 'sustainable_seafood' },
          { title: 'Farm-to-Table', value: 'farm_to_table' }
        ]
      },
      validation: Rule => Rule.min(2).error('Please specify at least two sustainability initiatives')
    },
    {
      name: 'dietaryOptions',
      title: 'Dietary Options',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Vegan', value: 'vegan' },
          { title: 'Vegetarian', value: 'vegetarian' },
          { title: 'Gluten-Free', value: 'gluten_free' },
          { title: 'Dairy-Free', value: 'dairy_free' },
          { title: 'Raw', value: 'raw' },
          { title: 'Keto', value: 'keto' },
          { title: 'Halal', value: 'halal' }
        ]
      },
      validation: Rule => Rule.min(1).error('Please specify available dietary options')
    },
    {
      name: 'seating',
      title: 'Seating Options',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Indoor', value: 'indoor' },
          { title: 'Outdoor Garden', value: 'outdoor_garden' },
          { title: 'Rooftop', value: 'rooftop' },
          { title: 'Bar Seating', value: 'bar' },
          { title: 'Private Rooms', value: 'private_rooms' }
        ]
      },
      validation: Rule => Rule.min(1).error('Please specify available seating options')
    },
    {
      name: 'workFriendly',
      title: 'Work-Friendly Features',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'WiFi', value: 'wifi' },
          { title: 'Power Outlets', value: 'power_outlets' },
          { title: 'Large Tables', value: 'large_tables' },
          { title: 'Quiet Areas', value: 'quiet_areas' },
          { title: 'Long Stay Friendly', value: 'long_stay_friendly' }
        ]
      }
    },
    {
      name: 'averageMealPriceThb',
      title: 'Average Meal Price (THB)',
      type: 'object',
      fields: [
        {
          name: 'min',
          title: 'Minimum Price',
          type: 'number',
          validation: Rule => Rule.required().min(0)
        },
        {
          name: 'max',
          title: 'Maximum Price',
          type: 'number',
          validation: Rule => Rule.required().min(0)
        }
      ],
      validation: Rule => Rule.custom((prices, context) => {
        if (prices?.max < prices?.min) {
          return 'Maximum price must be greater than minimum price'
        }
        return true
      })
    }
  ]
}

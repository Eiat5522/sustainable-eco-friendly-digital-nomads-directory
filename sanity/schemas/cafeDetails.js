/**
 * Cafe Details schema for Sanity CMS
 * Used as an object type within the listing schema
 */

export default {
  name: 'cafeDetails',
  title: 'Cafe Details',
  type: 'object',
  validation: Rule => Rule.required().error('Cafe details are required for cafe listings'),
  fields: [
    {
      name: 'operatingHours',
      title: 'Operating Hours',
      type: 'string',
      validation: Rule => Rule.required().error('Operating hours are required')
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
    }
  ]
}

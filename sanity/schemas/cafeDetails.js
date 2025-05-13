/**
 * Cafe Details schema for Sanity CMS
 * Used as an object type within the listing schema
 */

export default {
  name: 'cafeDetails',
  title: 'Cafe Details',
  type: 'object',
  fields: [
    {
      name: 'operatingHours',
      title: 'Operating Hours',
      type: 'string'
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
      }
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
      ]
    },
    {
      name: 'wifiReliabilityNotes',
      title: 'WiFi Reliability Notes',
      type: 'text',
      rows: 2
    },
    {
      name: 'wifiSpeed',
      title: 'WiFi Speed (Mbps)',
      type: 'number'
    },
    {
      name: 'workFriendlySeating',
      title: 'Work-Friendly Seating',
      type: 'boolean',
      description: 'Does the cafe have comfortable seating suitable for working?'
    },
    {
      name: 'powerOutlets',
      title: 'Power Outlets',
      type: 'string',
      options: {
        list: [
          { title: 'Abundant', value: 'abundant' },
          { title: 'Limited', value: 'limited' },
          { title: 'Very Few', value: 'very_few' },
          { title: 'None', value: 'none' }
        ]
      }
    },
    {
      name: 'noiseLevel',
      title: 'Noise Level',
      type: 'string',
      options: {
        list: [
          { title: 'Very Quiet', value: 'very_quiet' },
          { title: 'Quiet', value: 'quiet' },
          { title: 'Moderate', value: 'moderate' },
          { title: 'Loud', value: 'loud' },
          { title: 'Very Loud', value: 'very_loud' }
        ]
      }
    }
  ]
}

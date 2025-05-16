export default {
  name: 'amenities',
  title: 'Amenities',
  type: 'object',
  fields: [
    {
      name: 'wifiQuality',
      title: 'WiFi Quality',
      type: 'string',
      options: {
        list: [
          { title: '🚀 High Speed (100+ Mbps)', value: 'high_speed' },
          { title: '💻 Good (50-100 Mbps)', value: 'good' },
          { title: '📱 Basic (20-50 Mbps)', value: 'basic' },
          { title: '⚠️ Limited (<20 Mbps)', value: 'limited' },
          { title: '❌ No WiFi', value: 'none' }
        ],
        layout: 'radio'
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'wifiSpeed',
      title: 'WiFi Speed (Mbps)',
      type: 'number',
      validation: Rule => Rule.min(0).max(1000)
    },
    {
      name: 'powerOutlets',
      title: 'Power Outlets',
      type: 'string',
      options: {
        list: [
          { title: 'Abundant', value: 'abundant' },
          { title: 'Limited', value: 'limited' },
          { title: 'None', value: 'none' }
        ]
      }
    },
    {
      name: 'seating',
      title: 'Seating',
      type: 'string',
      options: {
        list: [
          { title: 'Comfortable', value: 'comfortable' },
          { title: 'Standard', value: 'standard' },
          { title: 'Limited', value: 'limited' }
        ]
      }
    },
    {
      name: 'airConditioning',
      title: 'Air Conditioning',
      type: 'boolean'
    },
    {
      name: 'quietSpace',
      title: 'Quiet Space',
      type: 'boolean'
    },
    {
      name: 'meetingRooms',
      title: 'Meeting Rooms',
      type: 'boolean'
    },
    {
      name: 'phoneBooths',
      title: 'Phone Booths',
      type: 'boolean'
    },
    {
      name: 'printers',
      title: 'Printers',
      type: 'boolean'
    },
    {
      name: 'parking',
      title: 'Parking',
      type: 'boolean'
    },
    {
      name: 'bikeParking',
      title: 'Bike Parking',
      type: 'boolean'
    },
    {
      name: 'showers',
      title: 'Showers',
      type: 'boolean'
    },
    {
      name: 'lockers',
      title: 'Lockers',
      type: 'boolean'
    },
    {
      name: 'kitchen',
      title: 'Kitchen',
      type: 'boolean'
    },
    {
      name: 'additionalAmenities',
      title: 'Additional Amenities',
      type: 'array',
      of: [{ type: 'string' }]
    }
  ]
}

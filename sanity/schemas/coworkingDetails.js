/**
 * Coworking Details schema for Sanity CMS
 * Used as an object type within the listing schema
 */

export default {
  name: 'coworkingDetails',
  title: 'Coworking Details',
  type: 'object',
  validation: Rule => Rule.required().error('Coworking details are required for coworking spaces'),
  fields: [
    {
      name: 'operatingHours',
      title: 'Operating Hours',
      type: 'string',
      validation: Rule => Rule.required().error('Operating hours are required')
    },
    {
      name: 'pricingPlans',
      title: 'Pricing Plans',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'type',
              title: 'Type',
              type: 'string',
              options: {
                list: [
                  { title: 'Daily', value: 'daily' },
                  { title: 'Weekly', value: 'weekly' },
                  { title: 'Monthly', value: 'monthly' },
                  { title: 'Hot Desk', value: 'hot_desk' },
                  { title: 'Dedicated Desk', value: 'dedicated_desk' },
                  { title: 'Private Office', value: 'private_office' },
                  { title: 'Meeting Room', value: 'meeting_room' },
                  { title: 'Day Pass', value: 'day_pass' }
                ]
              },
              validation: Rule => Rule.required().error('Pricing type is required')
            },
            {
              name: 'priceTHB',
              title: 'Price (THB)',
              type: 'number',
              validation: Rule => Rule.required().min(0).error('Price must be a non-negative number')
            },
            {
              name: 'description',
              title: 'Description',
              type: 'string',
              validation: Rule => Rule.max(200).warning('Keep descriptions concise')
            }
          ]
        }
      ],
      validation: Rule => Rule.required().min(1).error('At least one pricing plan is required')
    },
    {
      name: 'amenities',
      title: 'Amenities',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'High-speed WiFi', value: 'high_speed_wifi' },
          { title: 'Meeting Rooms', value: 'meeting_rooms' },
          { title: 'Standing Desks', value: 'standing_desks' },
          { title: 'Phone Booths', value: 'phone_booths' },
          { title: 'Kitchen', value: 'kitchen' },
          { title: 'Free Coffee/Tea', value: 'free_coffee_tea' },
          { title: 'Printing Services', value: 'printing' },
          { title: '24/7 Access', value: '24_7_access' }
        ]
      },
      validation: Rule => Rule.min(1).error('Please specify available amenities')
    },
    {
      name: 'internetSpeed',
      title: 'Internet Speed',
      type: 'object',
      fields: [
        {
          name: 'download',
          title: 'Download Speed (Mbps)',
          type: 'number',
          validation: Rule => Rule.min(0)
        },
        {
          name: 'upload',
          title: 'Upload Speed (Mbps)',
          type: 'number',
          validation: Rule => Rule.min(0)
        },
        {
          name: 'lastTested',
          title: 'Last Tested',
          type: 'datetime'
        },
        {
          name: 'redundancy',
          title: 'Internet Redundancy',
          type: 'boolean',
          description: 'Does the space have backup internet connection?'
        }
      ]
    },
    {
      name: 'events',
      title: 'Events & Workshops',
      type: 'array',
      of: [{
        type: 'reference',
        to: [{ type: 'event' }]
      }]
    },
    {
      name: 'accessPolicy',
      title: 'Access Policy',
      type: 'object',
      fields: [
        {
          name: 'hours',
          title: '24/7 Access',
          type: 'boolean'
        },
        {
          name: 'membershipRequired',
          title: 'Membership Required',
          type: 'boolean'
        },
        {
          name: 'dayPassAvailable',
          title: 'Day Pass Available',
          type: 'boolean'
        },
        {
          name: 'guestPolicy',
          title: 'Guest Policy',
          type: 'string',
          options: {
            list: [
              { title: 'No Guests', value: 'no_guests' },
              { title: 'Paid Guest Pass', value: 'paid' },
              { title: 'Free Guest Pass', value: 'free' },
              { title: 'Members Only', value: 'members' }
            ]
          }
        }
      ]
    }
  ]
}

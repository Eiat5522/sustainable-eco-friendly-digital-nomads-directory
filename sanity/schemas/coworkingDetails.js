/**
 * Coworking Details schema for Sanity CMS
 * Used as an object type within the listing schema
 */

export default {
  name: 'coworkingDetails',
  title: 'Coworking Details',
  type: 'object',
  fields: [
    {
      name: 'operatingHours',
      title: 'Operating Hours',
      type: 'string'
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
              }
            },
            {
              name: 'priceTHB',
              title: 'Price (THB)',
              type: 'number'
            },
            {
              name: 'priceNotes',
              title: 'Price Notes',
              type: 'string'
            }
          ],
          preview: {
            select: {
              title: 'type',
              subtitle: 'priceTHB'
            },
            prepare({ title, subtitle }) {
              return {
                title: title,
                subtitle: subtitle ? `${subtitle} THB` : 'No price set'
              }
            }
          }
        }
      ]
    },
    {
      name: 'specificAmenities',
      title: 'Specific Amenities',
      type: 'array',
      of: [
        {
          type: 'string',
          options: {
            list: [
              { title: 'AC Rooms', value: 'ac_rooms' },
              { title: 'Outdoor Seating Area', value: 'outdoor_seating_area' },
              { title: 'Call Rooms/Skype Booths', value: 'skype_booths_call_rooms' },
              { title: 'Printer/Scanner/Copier', value: 'printer_scanner_copier' },
              { title: 'Monitor Rental', value: 'monitor_rental_available' },
              { title: 'On-site Cafe/Restaurant', value: 'on_site_cafe_restaurant' },
              { title: 'Kitchen Access', value: 'kitchen_access_shared' },
              { title: 'Personal Lockers', value: 'personal_lockers' },
              { title: 'Event Space', value: 'event_space_available' },
              { title: 'Bike Parking', value: 'bike_parking' },
              { title: 'Car Parking', value: 'car_parking' },
              { title: 'Private Offices', value: 'private_offices' },
              { title: 'Coworking Desks', value: 'coworking_desks' },
              { title: 'Virtual Offices', value: 'virtual_offices' }
            ]
          }
        }
      ]
    }
  ]
}

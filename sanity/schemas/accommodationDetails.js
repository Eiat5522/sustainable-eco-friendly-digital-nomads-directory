/**
 * Accommodation Details schema for Sanity CMS
 * Used as an object type within the listing schema
 */

export default {
  name: 'accommodationDetails',
  title: 'Accommodation Details',
  type: 'object',
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
      }
     ,validation: Rule => Rule.required().error('Accommodation type is required')
    },
    {
      name: 'priceRangeThb',
      title: 'Price Range (THB)',
      type: 'object',
      fields: [
        {
          name: 'min',
          title: 'Minimum Price',
          type: 'number'
     ,validation: Rule => Rule.required().min(0).error('Minimum price is required and must be non-negative')
        },
        {
          name: 'max',
          title: 'Maximum Price',
          type: 'number'
     ,validation: Rule => Rule.required().min(0).error('Maximum price is required and must be non-negative')
        }
      ]
    },
    {
      name: 'roomTypesAvailable',
      title: 'Room Types Available',
      type: 'array',
      of: [
        {
          type: 'string',
          options: {
            list: [
              { title: 'Private Room (Ensuite)', value: 'private_room_ensuite' },
              { title: 'Private Room (Shared Bath)', value: 'private_room_shared_bath' },
              { title: 'Dorm Bed', value: 'dorm_bed' },
              { title: 'Studio Apartment', value: 'studio_apartment' },
              { title: 'One Bedroom', value: 'one_bedroom' },
              { title: 'Two Bedroom', value: 'two_bedroom' },
              { title: 'Pool Villa', value: 'pool_villa' },
              { title: 'Bungalow', value: 'bungalow' },
              { title: 'Tent/Glamping', value: 'tent_glamping' }
            ]
          }
        }
      ]
     ,validation: Rule => Rule.min(1).warning('Add at least one room type if possible')
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
              { title: 'Swimming Pool', value: 'swimming_pool' },
              { title: 'On-site Restaurant/Bar', value: 'on_site_restaurant_bar' },
              { title: 'Private Beach Access', value: 'private_beach_access' },
              { title: 'Fitness Center/Gym', value: 'fitness_center_gym' },
              { title: 'Coworking Space', value: 'coworking_space' },
              { title: 'Kitchen', value: 'kitchen' },
              { title: 'Laundry Facilities', value: 'laundry_facilities' },
              { title: 'Free Bicycles', value: 'free_bicycles' },
              { title: 'Daily Cleaning', value: 'daily_cleaning' },
              { title: 'Airport Transfer', value: 'airport_transfer' },
              { title: 'Yoga Classes', value: 'yoga_classes' },
              { title: 'Meditation Space', value: 'meditation_space' }
            ]
          }
        }
      ]
     ,validation: Rule => Rule.min(1).warning('Add at least one amenity if possible')
    },
    {
      name: 'wifiSpeed',
      title: 'WiFi Speed (Mbps)',
      type: 'number'
    },
    {
      name: 'minimumStay',
      title: 'Minimum Stay (days)',
      type: 'number'
    },
    {
      name: 'workspaceInRoom',
      title: 'Workspace in Room',
      type: 'boolean',
      description: 'Does the accommodation provide a suitable workspace within rooms?'
    }
  ]
}

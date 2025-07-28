import { defineField, defineType } from 'sanity'
import { imageWithAlt } from './fields'

export default defineType({
  name: 'listing',
  title: 'Listing',
  type: 'document',
  fields: [
    // Name (required)
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: Rule => Rule.required(),
      options: { searchBoost: 2.0 }
    }),
    // Amenities (optional, reference)
    defineField({
      name: 'amenities',
      title: 'Amenities',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'amenity' }] }],
      description: 'Select one or more amenities for this listing. Not required.'
    }),
    // Accommodation details (if category is accommodation)
    defineField({
      name: 'accommodationDetails',
      title: 'Accommodation Details',
      type: 'accommodationDetails',
      hidden: ({ parent }) => parent?.category !== 'accommodation'
    }),
    // Activities details (if category is activities)
    defineField({
      name: 'activitiesDetails',
      title: 'Activities Details',
      type: 'activitiesDetails',
      hidden: ({ parent }) => parent?.category !== 'activities'
    }),
    // Cafe details (if category is cafe)
    defineField({
      name: 'cafeDetails',
      title: 'Cafe Details',
      type: 'cafeDetails',
      hidden: ({ parent }) => parent?.category !== 'cafe'
    }),
    // Coworking details (if category is coworking)
    defineField({
      name: 'coworkingDetails',
      title: 'Coworking Details',
      type: 'coworkingDetails',
      hidden: ({ parent }) => parent?.category !== 'coworking'
    }),
    // Restaurant details (if category is restaurant)
    defineField({
      name: 'restaurantDetails',
      title: 'Restaurant Details',
      type: 'restaurantDetails',
      hidden: ({ parent }) => parent?.category !== 'restaurant'
    })
    // ...add other shared or category-specific fields as needed...
  ]
});

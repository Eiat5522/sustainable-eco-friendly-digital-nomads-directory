// NOTE: City documents intentionally do NOT include a `location` geopoint.
// The `Listing` document stores a `location` geopoint (lat/lng) for map display.
// Keep city as a reference on a Listing and dereference (city->) in GROQ when you need city.name/country.
// City schema intentionally does NOT include a location/geopoint field.
// All location/geopoint data is stored on Listing documents only.
// This prevents confusion and enforces a single source of geospatial truth.
// Example GROQ usage:
// *[_type == "listing" && defined(city)]{
//   ...,
//   "cityName": city->name,
//   "country": city->country
import { defineField, defineType } from 'sanity'
import { imageWithAlt } from './fields'

export default defineType({
  name: 'city',
  title: 'City',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'City Name (e.g., Chiang Mai)',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'country',
      title: 'Country (e.g., Thailand)',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'A short description of the city, its eco-friendliness, and nomad appeal.',
    }),
    defineField({
      name: 'sustainabilityScore',
      title: 'Sustainability Score',
      type: 'number',
      description: 'Score out of 100.',
      validation: (Rule) => Rule.required().min(0).max(100),
    }),
    defineField({
      name: 'highlights',
      title: 'Eco Highlights',
      type: 'array',
      of: [{type: 'string'}],
      description: 'List key sustainability features or attractions.',
    }),
    defineField({
      name: 'primaryImage',
      title: 'Primary Image',
      ...imageWithAlt
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'country',
      media: 'primaryImage',
    },
  },
})

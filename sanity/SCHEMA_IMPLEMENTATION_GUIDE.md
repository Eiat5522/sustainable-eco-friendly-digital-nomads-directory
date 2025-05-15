# Sanity Schema Implementation Guide

## Overview

This document outlines the implementation details for the Sanity CMS schema in our Sustainable Eco-Friendly Digital Nomads Directory. It covers the various data types used, validation rules, and best practices for content modeling.

## Core Schema Types

### 1. Listing Schema

The `listing` schema is the central content type in our application, representing venues like cafes, coworking spaces, and accommodations.

```javascript
// schemas/listing.js
export default {
  name: 'listing',
  title: 'Listing',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: Rule => Rule.required().min(3).max(100)
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{ type: 'block' }],
      validation: Rule => Rule.required()
    },
    {
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Café', value: 'cafe' },
          { title: 'Coworking', value: 'coworking' },
          { title: 'Accommodation', value: 'accommodation' },
          { title: 'Restaurant', value: 'restaurant' },
          { title: 'Activity', value: 'activity' }
        ]
      },
      validation: Rule => Rule.required().min(1)
    },
    {
      name: 'mainImage',
      title: 'Main Image',
      type: 'image',
      options: {
        hotspot: true
      },
      fields: [
        {
          name: 'alt',
          title: 'Alternative Text',
          type: 'string',
          validation: Rule => Rule.required()
        }
      ],
      validation: Rule => Rule.required()
    },
    {
      name: 'images',
      title: 'Image Gallery',
      type: 'array',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            {
              name: 'alt',
              title: 'Alternative Text',
              type: 'string'
            },
            {
              name: 'caption',
              title: 'Caption',
              type: 'string'
            }
          ]
        }
      ]
    },
    {
      name: 'location',
      title: 'Location',
      type: 'object',
      fields: [
        {
          name: 'address',
          title: 'Address',
          type: 'string',
          validation: Rule => Rule.required()
        },
        {
          name: 'city',
          title: 'City',
          type: 'reference',
          to: [{ type: 'city' }],
          validation: Rule => Rule.required()
        },
        {
          name: 'geopoint',
          title: 'Geographic Coordinates',
          type: 'geopoint',
          validation: Rule => Rule.required()
        }
      ]
    },
    {
      name: 'ecoTags',
      title: 'Eco Features',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'ecoTag' }] }]
    },
    {
      name: 'nomadFeatures',
      title: 'Digital Nomad Features',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'nomadFeature' }] }]
    },
    {
      name: 'website',
      title: 'Website',
      type: 'url'
    },
    {
      name: 'phone',
      title: 'Phone',
      type: 'string'
    },
    {
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: Rule => Rule.email()
    },
    {
      name: 'openingHours',
      title: 'Opening Hours',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'day',
              title: 'Day',
              type: 'string',
              options: {
                list: [
                  'Monday',
                  'Tuesday',
                  'Wednesday',
                  'Thursday',
                  'Friday',
                  'Saturday',
                  'Sunday'
                ]
              }
            },
            {
              name: 'open',
              title: 'Opening Time',
              type: 'string'
            },
            {
              name: 'close',
              title: 'Closing Time',
              type: 'string'
            },
            {
              name: 'isClosed',
              title: 'Closed',
              type: 'boolean',
              initialValue: false
            }
          ],
          preview: {
            select: {
              day: 'day',
              open: 'open',
              close: 'close',
              isClosed: 'isClosed'
            },
            prepare({ day, open, close, isClosed }) {
              return {
                title: day,
                subtitle: isClosed ? 'Closed' : `${open} - ${close}`
              };
            }
          }
        }
      ]
    },
    {
      name: 'priceRange',
      title: 'Price Range',
      type: 'string',
      options: {
        list: [
          { title: '$', value: '$' },
          { title: '$$', value: '$$' },
          { title: '$$$', value: '$$$' },
          { title: '$$$$', value: '$$$$' }
        ]
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'categoryDetails',
      title: 'Category Details',
      type: 'array',
      of: [
        { type: 'cafeDetails' },
        { type: 'coworkingDetails' },
        { type: 'accommodationDetails' },
        { type: 'restaurantDetails' },
        { type: 'activitiesDetails' }
      ]
    }
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'location.city.name',
      media: 'mainImage'
    }
  }
};
```

### 2. Support Schema Types

#### City Schema

```javascript
// schemas/city.js
export default {
  name: 'city',
  title: 'City',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'country',
      title: 'Country',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{ type: 'block' }]
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        {
          name: 'alt',
          title: 'Alternative Text',
          type: 'string',
          validation: Rule => Rule.required()
        }
      ]
    },
    {
      name: 'geopoint',
      title: 'Geographic Coordinates',
      type: 'geopoint',
      validation: Rule => Rule.required()
    }
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'country',
      media: 'image'
    }
  }
};
```

#### EcoTag Schema

```javascript
// schemas/ecoTag.js
export default {
  name: 'ecoTag',
  title: 'Eco Tags',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text'
    },
    {
      name: 'icon',
      title: 'Icon',
      type: 'string'
    }
  ],
  preview: {
    select: {
      title: 'name'
    }
  }
};
```

#### NomadFeature Schema

```javascript
// schemas/nomadFeature.js
export default {
  name: 'nomadFeature',
  title: 'Digital Nomad Features',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text'
    },
    {
      name: 'icon',
      title: 'Icon',
      type: 'string'
    }
  ],
  preview: {
    select: {
      title: 'name'
    }
  }
};
```

## Category-Specific Schema Types

### Café Details

```javascript
// schemas/cafeDetails.js
export default {
  name: 'cafeDetails',
  title: 'Café Details',
  type: 'object',
  fields: [
    {
      name: 'wifiSpeed',
      title: 'WiFi Speed (Mbps)',
      type: 'number',
      validation: Rule => Rule.min(0)
    },
    {
      name: 'powerOutlets',
      title: 'Power Outlets Availability',
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
      name: 'noiseLevel',
      title: 'Noise Level',
      type: 'string',
      options: {
        list: [
          { title: 'Quiet', value: 'quiet' },
          { title: 'Moderate', value: 'moderate' },
          { title: 'Noisy', value: 'noisy' }
        ]
      }
    },
    {
      name: 'workFriendly',
      title: 'Work-friendly Rating',
      type: 'number',
      validation: Rule => Rule.min(1).max(5).integer()
    },
    {
      name: 'specialDiets',
      title: 'Special Diets',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Vegetarian', value: 'vegetarian' },
          { title: 'Vegan', value: 'vegan' },
          { title: 'Gluten-free', value: 'gluten-free' },
          { title: 'Dairy-free', value: 'dairy-free' }
        ]
      }
    }
  ]
};
```

### Coworking Details

```javascript
// schemas/coworkingDetails.js
export default {
  name: 'coworkingDetails',
  title: 'Coworking Details',
  type: 'object',
  fields: [
    {
      name: 'wifiSpeed',
      title: 'WiFi Speed (Mbps)',
      type: 'number',
      validation: Rule => Rule.min(0)
    },
    {
      name: 'deskTypes',
      title: 'Desk Types',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Hot Desk', value: 'hot-desk' },
          { title: 'Dedicated Desk', value: 'dedicated-desk' },
          { title: 'Private Office', value: 'private-office' },
          { title: 'Meeting Room', value: 'meeting-room' }
        ]
      }
    },
    {
      name: 'amenities',
      title: 'Amenities',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Printer', value: 'printer' },
          { title: 'Scanner', value: 'scanner' },
          { title: 'Phone Booth', value: 'phone-booth' },
          { title: 'Kitchen', value: 'kitchen' },
          { title: 'Free Coffee', value: 'free-coffee' },
          { title: 'Free Tea', value: 'free-tea' },
          { title: 'Snacks', value: 'snacks' },
          { title: 'Event Space', value: 'event-space' }
        ]
      }
    },
    {
      name: 'pricing',
      title: 'Pricing',
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
                  { title: 'Day Pass', value: 'day-pass' },
                  { title: 'Week Pass', value: 'week-pass' },
                  { title: 'Month Pass', value: 'month-pass' },
                  { title: 'Hot Desk', value: 'hot-desk' },
                  { title: 'Dedicated Desk', value: 'dedicated-desk' },
                  { title: 'Private Office', value: 'private-office' },
                  { title: 'Meeting Room', value: 'meeting-room' }
                ]
              }
            },
            {
              name: 'price',
              title: 'Price',
              type: 'number'
            },
            {
              name: 'currency',
              title: 'Currency',
              type: 'string',
              initialValue: 'USD'
            },
            {
              name: 'per',
              title: 'Per',
              type: 'string',
              options: {
                list: [
                  { title: 'Hour', value: 'hour' },
                  { title: 'Day', value: 'day' },
                  { title: 'Week', value: 'week' },
                  { title: 'Month', value: 'month' }
                ]
              }
            }
          ],
          preview: {
            select: {
              title: 'type',
              price: 'price',
              currency: 'currency',
              per: 'per'
            },
            prepare({ title, price, currency, per }) {
              return {
                title: title,
                subtitle: `${price} ${currency} per ${per}`
              };
            }
          }
        }
      ]
    }
  ]
};
```

## Validation Rules

For comprehensive validation of the schema, we implement rules that ensure:

1. **Required Fields**: Critical fields like name, slug, and location are mandatory
2. **String Length**: Text fields have appropriate min/max constraints
3. **Numeric Ranges**: Ratings and prices have reasonable bounds
4. **Relationships**: References to other documents are properly validated
5. **Image Requirements**: Images have alt text for accessibility
6. **Email Format**: Email fields are properly formatted

## GROQ Query Examples

### Basic Listing Query

```javascript
// Get all listings with their cities and eco tags
const query = `*[_type == "listing"] {
  _id,
  name,
  slug,
  description,
  mainImage {
    asset->{
      _id,
      url
    },
    alt
  },
  "city": location.city->{name, country},
  "ecoTags": ecoTags[]->{name, description}
}`
```

### Filtered Query by Category and Location

```javascript
// Get coworking spaces in Bangkok with fast wifi
const query = `*[_type == "listing" && 
  "coworking" in categories && 
  location.city._ref in *[_type == "city" && name == "Bangkok"]._id && 
  *[_id == ^.categoryDetails[]._key && _type == "coworkingDetails" && wifiSpeed >= 50]]
{
  _id,
  name,
  slug,
  location,
  "wifiSpeed": *[_id == ^.categoryDetails[]._key && _type == "coworkingDetails"].wifiSpeed[0]
}`
```

### Complex Search Query

```javascript
// Search listings by keyword, filter by eco features and price range
const query = `*[_type == "listing" && 
  (name match $searchTerm || description match $searchTerm) &&
  count((ecoTags[]->name)[@ in $selectedEcoTags]) > 0 &&
  priceRange in $priceRanges]
{
  _id,
  name,
  slug,
  priceRange,
  "ecoTags": ecoTags[]->{name},
  "city": location.city->{name, country},
  mainImage {
    asset->{url},
    alt
  }
}[$start...$end]`

// Parameters
const params = {
  searchTerm: "sustainable",
  selectedEcoTags: ["Solar Powered", "Plastic Free"],
  priceRanges: ["$", "$$"],
  start: 0,
  end: 10
}
```

## Best Practices

1. **Use References**: For related content that might be shared across listings
2. **Object Types**: For nested data structures specific to a document
3. **Arrays of References**: For many-to-many relationships
4. **Custom Input Components**: When default inputs don't meet needs
5. **Preview Configurations**: To make content management intuitive
6. **Validation Rules**: To enforce data quality and consistency

## Schema Organization

In `schemas/index.js`, we export all schema types:

```javascript
// schemas/index.js
import listing from './listing'
import city from './city'
import ecoTag from './ecoTag'
import nomadFeature from './nomadFeature'
import cafeDetails from './cafeDetails'
import coworkingDetails from './coworkingDetails'
import accommodationDetails from './accommodationDetails'
import restaurantDetails from './restaurantDetails'
import activitiesDetails from './activitiesDetails'
import review from './review'
import blogPost from './blogPost'
import event from './event'

export const schemaTypes = [
  listing,
  city,
  ecoTag,
  nomadFeature,
  cafeDetails,
  coworkingDetails,
  accommodationDetails,
  restaurantDetails,
  activitiesDetails,
  review,
  blogPost,
  event
]
```

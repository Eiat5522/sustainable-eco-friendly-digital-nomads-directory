import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'searchConfig',
  title: 'Search Configuration',
  type: 'document',
  fields: [
    defineField({
      name: 'fieldBoosts',
      title: 'Field Boost Settings',      type: 'object',
      fields: [
        {
          name: 'name',
          type: 'number',
          title: 'Name Boost',
          initialValue: 2.0,
          validation: Rule => Rule.required().min(0).max(10)
        },
        {
          name: 'description',
          type: 'number',
          title: 'Description Boost',
          initialValue: 1.0,
          validation: Rule => Rule.required().min(0).max(10)
        },
        {
          name: 'eco_tags',
          type: 'number',
          title: 'Eco Tags Boost',
          initialValue: 1.5,
          validation: Rule => Rule.required().min(0).max(10)
        },
        {
          name: 'city',
          type: 'number',
          title: 'City Boost',
          initialValue: 1.8,
          validation: Rule => Rule.required().min(0).max(10)
        }
      ]
    }),
    defineField({
      name: 'geoSearchSettings',
      title: 'Geo Search Settings',
      type: 'object',
      fields: [
        {name: 'defaultRadius', type: 'number', title: 'Default Radius (km)', initialValue: 5},
        {name: 'maxRadius', type: 'number', title: 'Maximum Radius (km)', initialValue: 50},
      ]
    }),
    defineField({
      name: 'facetedSearchConfig',
      title: 'Faceted Search Configuration',      type: 'array',
      of: [{
        type: 'object',
        fields: [
          {
            name: 'fieldName',
            type: 'string',
            title: 'Field Name',
            validation: Rule => Rule.required()
          },
          {
            name: 'displayName',
            type: 'string',
            title: 'Display Name',
            validation: Rule => Rule.required()
          },
          {
            name: 'type',
            type: 'string',
            title: 'Type',
            options: {
              list: ['categorical', 'range', 'boolean', 'date']
            },
            validation: Rule => Rule.required()
          },
          {
            name: 'rangeConfig',
            type: 'object',
            title: 'Range Configuration',
            hidden: ({parent}) => parent?.type !== 'range',
            fields: [
              {
                name: 'min',
                type: 'number',
                title: 'Minimum Value'
              },
              {
                name: 'max',
                type: 'number',
                title: 'Maximum Value'
              },
              {
                name: 'step',
                type: 'number',
                title: 'Step Size',
                initialValue: 1
              }
            ]
          },
          {
            name: 'categoryConfig',
            type: 'object',
            title: 'Category Configuration',
            hidden: ({parent}) => parent?.type !== 'categorical',
            fields: [
              {
                name: 'multiSelect',
                type: 'boolean',
                title: 'Allow Multiple Selection',
                initialValue: true
              },
              {
                name: 'showCount',
                type: 'boolean',
                title: 'Show Result Count',
                initialValue: true
              }
            ]
          }
        ],
        preview: {
          select: {
            title: 'displayName',
            subtitle: 'type'
          }
        }
      }]
    }),
    defineField({
      name: 'sortOptions',
      title: 'Sort Options',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          {
            name: 'field',
            type: 'string',
            title: 'Field Name',
            validation: Rule => Rule.required()
          },
          {
            name: 'displayName',
            type: 'string',
            title: 'Display Name',
            validation: Rule => Rule.required()
          },
          {
            name: 'direction',
            type: 'string',
            title: 'Default Direction',
            options: {
              list: [
                {title: 'Ascending', value: 'asc'},
                {title: 'Descending', value: 'desc'}
              ]
            },
            validation: Rule => Rule.required()
          }
        ]
      }],
      validation: Rule => Rule.min(1)
    }),
    defineField({
      name: 'performanceSettings',
      title: 'Performance Settings',
      type: 'object',
      fields: [
        {
          name: 'cacheDuration',
          type: 'number',
          title: 'Cache Duration (seconds)',
          initialValue: 300,
          validation: Rule => Rule.required().min(0)
        },
        {
          name: 'maxResults',
          type: 'number',
          title: 'Maximum Results Per Query',
          initialValue: 100,
          validation: Rule => Rule.required().min(1).max(1000)
        },
        {
          name: 'paginationSize',
          type: 'number',
          title: 'Results Per Page',
          initialValue: 20,
          validation: Rule => Rule.required().min(1).max(100)
        }
      ]
    }),
  ]
})

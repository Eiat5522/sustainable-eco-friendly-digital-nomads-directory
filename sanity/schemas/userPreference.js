export default {
  name: 'userPreference',
  title: 'User Preference',
  type: 'document',
  fields: [
    {
      name: 'user',
      title: 'User',
      type: 'reference',
      to: [{type: 'user'}],
      validation: Rule => Rule.required()
    },
    {
      name: 'preferredCategories',
      title: 'Preferred Categories',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        list: [
          {title: 'Coworking', value: 'coworking'},
          {title: 'Cafe', value: 'cafe'},
          {title: 'Accommodation', value: 'accommodation'},
          {title: 'Restaurant', value: 'restaurant'},
          {title: 'Activities', value: 'activities'}
        ]
      }
    },
    {
      name: 'preferredCities',
      title: 'Preferred Cities',
      type: 'array',
      of: [{
        type: 'reference',
        to: [{type: 'city'}]
      }]
    },
    {
      name: 'preferredEcoTags',
      title: 'Preferred Eco Tags',
      type: 'array',
      of: [{
        type: 'reference',
        to: [{type: 'ecoTag'}]
      }]
    },
    {
      name: 'priceRangePreference',
      title: 'Price Range Preference',
      type: 'string',
      options: {
        list: [
          {title: 'Budget', value: 'budget'},
          {title: 'Mid-Range', value: 'midRange'},
          {title: 'Premium', value: 'premium'}
        ]
      }
    },
    {
      name: 'notificationPreferences',
      title: 'Notification Preferences',
      type: 'object',
      fields: [
        {
          name: 'email',
          title: 'Email Notifications',
          type: 'boolean',
          initialValue: true
        },
        {
          name: 'push',
          title: 'Push Notifications',
          type: 'boolean',
          initialValue: false
        },
        {
          name: 'frequency',
          title: 'Notification Frequency',
          type: 'string',
          options: {
            list: [
              {title: 'Daily', value: 'daily'},
              {title: 'Weekly', value: 'weekly'},
              {title: 'Monthly', value: 'monthly'}
            ]
          },
          initialValue: 'weekly'
        }
      ]
    },
    {
      name: 'lastUpdated',
      title: 'Last Updated',
      type: 'datetime',
      validation: Rule => Rule.required()
    }
  ],
  preview: {
    select: {
      title: 'user.name',
      categories: 'preferredCategories',
      cities: 'preferredCities'
    },
    prepare({title, categories, cities}) {
      return {
        title: title || 'Unnamed User',
        subtitle: `Categories: ${(categories || []).length} | Cities: ${(cities || []).length}`
      }
    }
  }
}

/**
 * Activities Details schema for Sanity CMS
 * Used as an object type within the listing schema
 */

export default {
  name: 'activitiesDetails',
  title: 'Activities Details',
  type: 'object',
  validation: Rule => Rule.required().error('Activity details are required for activity listings'),
  fields: [
    {
      name: 'activityType',
      title: 'Activity Type',
      type: 'string',
      options: {
        list: [
          { title: 'Yoga/Wellness', value: 'yoga_wellness' },
          { title: 'Outdoor Adventure', value: 'outdoor_adventure' },
          { title: 'Cultural Experience', value: 'cultural_experience' },
          { title: 'Eco Tour', value: 'eco_tour' },
          { title: 'Cooking Class', value: 'cooking_class' },
          { title: 'Meditation/Mindfulness', value: 'meditation_mindfulness' },
          { title: 'Community Service', value: 'community_service' },
          { title: 'Sustainable Workshop', value: 'sustainable_workshop' }
        ]
      },
      validation: Rule => Rule.required().error('Activity type is required')
    },
    {
      name: 'pricePerPerson',
      title: 'Price Per Person (THB)',
      type: 'object',
      fields: [
        {
          name: 'min',
          title: 'Starting From',
          type: 'number',
          validation: Rule => Rule.required().min(0).error('Minimum price must be non-negative')
        },
        {
          name: 'max',
          title: 'Up To',
          type: 'number',
          validation: Rule => Rule.required().min(0).error('Maximum price must be non-negative')
        }
      ],
      validation: Rule => Rule.custom((prices, context) => {
        if (prices?.max < prices?.min) {
          return 'Maximum price must be greater than minimum price'
        }
        return true
      })
    },
    {
      name: 'duration',
      title: 'Duration',
      type: 'object',
      fields: [
        {
          name: 'value',
          title: 'Duration Value',
          type: 'number',
          validation: Rule => Rule.required().min(0.5).error('Duration must be at least 30 minutes')
        },
        {
          name: 'unit',
          title: 'Duration Unit',
          type: 'string',
          options: {
            list: [
              { title: 'Hours', value: 'hours' },
              { title: 'Days', value: 'days' }
            ]
          },
          validation: Rule => Rule.required()
        }
      ],
      validation: Rule => Rule.required()
    },
    {
      name: 'groupSize',
      title: 'Group Size',
      type: 'object',
      fields: [
        {
          name: 'min',
          title: 'Minimum Participants',
          type: 'number',
          validation: Rule => Rule.required().min(1)
        },
        {
          name: 'max',
          title: 'Maximum Participants',
          type: 'number',
          validation: Rule => Rule.required().min(1)
        }
      ],
      validation: Rule => Rule.custom((sizes, context) => {
        if (sizes?.max < sizes?.min) {
          return 'Maximum group size must be greater than minimum'
        }
        return true
      })
    },
    {
      name: 'sustainabilityPractices',
      title: 'Sustainability Practices',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Zero Waste', value: 'zero_waste' },
          { title: 'Local Community Support', value: 'local_community_support' },
          { title: 'Wildlife Protection', value: 'wildlife_protection' },
          { title: 'Environmental Education', value: 'environmental_education' },
          { title: 'Plastic-Free', value: 'plastic_free' },
          { title: 'Carbon Offset Program', value: 'carbon_offset' }
        ]
      },
      validation: Rule => Rule.min(1).error('Please specify sustainability practices')
    },
    {
      name: 'skillLevel',
      title: 'Skill Level',
      type: 'string',
      options: {
        list: [
          { title: 'Beginner', value: 'beginner' },
          { title: 'Intermediate', value: 'intermediate' },
          { title: 'Advanced', value: 'advanced' },
          { title: 'All Levels', value: 'all_levels' }
        ]
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'languages',
      title: 'Languages',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'English', value: 'english' },
          { title: 'Thai', value: 'thai' },
          { title: 'Chinese', value: 'chinese' },
          { title: 'Japanese', value: 'japanese' },
          { title: 'Korean', value: 'korean' },
          { title: 'French', value: 'french' },
          { title: 'German', value: 'german' }
        ]
      },
      validation: Rule => Rule.required().min(1).error('Please specify available languages')
    }
  ]
}

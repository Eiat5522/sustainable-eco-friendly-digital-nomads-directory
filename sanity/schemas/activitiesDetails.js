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
    // Activity type (required)
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
          { title: 'Sustainable Workshop', value: 'sustainable_workshop' },
        ],
      },
      validation: Rule => Rule.required().error('Activity type is required'),
    },
    // Price per person (min/max)
    {
      name: 'pricePerPerson',
      title: 'Price Per Person (THB)',
      type: 'object',
      fields: [
        {
          name: 'min',
          title: 'Starting From',
          type: 'number',
          validation: Rule => Rule.required().min(0),
        },
        { name: 'max', title: 'Up To', type: 'number', validation: Rule => Rule.required().min(0) },
      ],
      validation: Rule =>
        Rule.custom(prices =>
          prices?.max < prices?.min ? 'Maximum price must be greater than minimum price' : true
        ),
    },
    // Duration (required)
    {
      name: 'duration',
      title: 'Duration',
      type: 'object',
      fields: [
        {
          name: 'value',
          title: 'Duration Value',
          type: 'number',
          validation: Rule => Rule.required().min(0.5),
        },
        {
          name: 'unit',
          title: 'Duration Unit',
          type: 'string',
          options: {
            list: [
              { title: 'Hours', value: 'hours' },
              { title: 'Days', value: 'days' },
            ],
          },
          validation: Rule => Rule.required(),
        },
      ],
      validation: Rule => Rule.required(),
    },
    // Group size (min/max)
    {
      name: 'groupSize',
      title: 'Group Size',
      type: 'object',
      fields: [
        {
          name: 'min',
          title: 'Minimum Participants',
          type: 'number',
          validation: Rule => Rule.required().min(1),
        },
        {
          name: 'max',
          title: 'Maximum Participants',
          type: 'number',
          validation: Rule => Rule.required().min(1),
        },
      ],
      validation: Rule =>
        Rule.custom(sizes =>
          sizes?.max < sizes?.min ? 'Maximum group size must be greater than minimum' : true
        ),
    },
    // Sustainability practices (at least one)
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
          { title: 'Carbon Offset Program', value: 'carbon_offset' },
        ],
      },
      validation: Rule => Rule.min(1).error('Please specify sustainability practices'),
    },
    // Skill level (required, radio)
    {
      name: 'skillLevel',
      title: 'Skill Level',
      type: 'string',
      options: {
        list: [
          { title: '🌱 Beginner', value: 'beginner', description: 'No experience needed' },
          {
            title: '🌿 Intermediate',
            value: 'intermediate',
            description: 'Some experience required',
          },
          { title: '🌳 Advanced', value: 'advanced', description: 'Experienced practitioners' },
          { title: '🌺 All Levels', value: 'all_levels', description: 'Adaptable to any level' },
        ],
        layout: 'radio',
      },
      validation: Rule => Rule.required(),
    },
    // Eco-friendly score (1-5, with certifications and justification)
    {
      name: 'ecoScore',
      title: 'Eco-friendly Score',
      type: 'object',
      fields: [
        {
          name: 'score',
          title: 'Score',
          type: 'number',
          validation: Rule => Rule.required().min(1).max(5),
        },
        {
          name: 'certifications',
          title: 'Eco Certifications',
          type: 'array',
          of: [{ type: 'string' }],
          options: {
            list: [
              { title: '🌏 Green Globe', value: 'green_globe' },
              { title: '🌍 Earth Check', value: 'earth_check' },
              { title: '🌲 Rainforest Alliance', value: 'rainforest_alliance' },
              { title: '🏆 LEED Certification', value: 'leed' },
              { title: '🌱 Local Eco Cert', value: 'local_eco' },
              { title: '♻️ Zero Waste', value: 'zero_waste' },
            ],
            layout: 'grid',
          },
        },
        {
          name: 'justification',
          title: 'Score Justification',
          type: 'text',
          rows: 3,
          validation: Rule => Rule.required(),
        },
      ],
    },
    // Language options (at least one required)
    {
      name: 'languages',
      title: 'Language Options',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'English', value: 'en' },
          { title: 'Thai', value: 'th' },
          { title: 'Chinese', value: 'zh' },
          { title: 'Japanese', value: 'ja' },
          { title: 'Korean', value: 'ko' },
          { title: 'German', value: 'de' },
          { title: 'French', value: 'fr' },
          { title: 'Spanish', value: 'es' },
        ],
      },
      validation: Rule => Rule.required().min(1),
    },
    // Accessibility (optional)
    {
      name: 'accessibility',
      title: 'Accessibility',
      type: 'object',
      fields: [
        { name: 'wheelchairAccessible', title: 'Wheelchair Accessible', type: 'boolean' },
        {
          name: 'mobilityLevel',
          title: 'Required Mobility Level',
          type: 'string',
          options: {
            list: [
              { title: 'Easy - Suitable for All', value: 'easy' },
              { title: 'Moderate - Some Walking', value: 'moderate' },
              { title: 'Challenging - Active', value: 'challenging' },
              { title: 'Difficult - Very Active', value: 'difficult' },
            ],
          },
        },
        { name: 'accessibilityNotes', title: 'Accessibility Notes', type: 'text', rows: 3 },
      ],
    },
    // Seasonality (optional)
    {
      name: 'seasonality',
      title: 'Seasonality',
      type: 'object',
      fields: [
        {
          name: 'bestMonths',
          title: 'Best Months',
          type: 'array',
          of: [{ type: 'string' }],
          options: {
            list: [
              { title: 'January', value: '01' },
              { title: 'February', value: '02' },
              { title: 'March', value: '03' },
              { title: 'April', value: '04' },
              { title: 'May', value: '05' },
              { title: 'June', value: '06' },
              { title: 'July', value: '07' },
              { title: 'August', value: '08' },
              { title: 'September', value: '09' },
              { title: 'October', value: '10' },
              { title: 'November', value: '11' },
              { title: 'December', value: '12' },
            ],
          },
        },
        { name: 'weatherDependent', title: 'Weather Dependent', type: 'boolean' },
      ],
    },
  ],
};

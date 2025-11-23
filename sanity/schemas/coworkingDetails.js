

export default {
  name: 'coworkingDetails',
  title: 'Coworking Details',
  type: 'object',
  validation: Rule => Rule.required().error('Coworking details are required for coworking spaces'),
  fields: [
    // Pricing plans (at least one required)
    {
      name: 'pricingPlans',
      type: 'array',
      of: [{ type: 'coworkingPricingPlan' }],
      validation: Rule => Rule.required().min(1),
    },
    // Opening hours (optional)
    { name: 'openingHours', type: 'array', of: [{ type: 'openingHoursEntry' }] },
    // Internet speed (required)
    {
      name: 'internetSpeed',
      title: 'Internet Speed',
      type: 'object',
      fields: [
        {
          name: 'download',
          title: 'Download Speed (Mbps)',
          type: 'number',
          validation: Rule => Rule.required().min(1),
        },
        {
          name: 'upload',
          title: 'Upload Speed (Mbps)',
          type: 'number',
          validation: Rule => Rule.required().min(1),
        },
        {
          name: 'lastTested',
          title: 'Last Tested',
          type: 'datetime',
          validation: Rule => Rule.required(),
        },
      ],
      validation: Rule => Rule.required(),
    },
  ],
};

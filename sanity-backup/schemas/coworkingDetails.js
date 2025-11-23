/**
 * Coworking Details schema for Sanity CMS
 * Used as an object type within the listing schema
 */

export default {
  name: 'coworkingDetails',
  title: 'Coworking Details',
  type: 'object',
  validation: Rule => Rule.required().error('Coworking details are required for coworking spaces'),
  fields: [
    {
      name: 'operatingHours',
      title: 'Operating Hours',
      type: 'string',
      validation: Rule => Rule.required().error('Operating hours are required')
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
                  { title: 'Hot Desk', value: 'hot-desk' },
                  { title: 'Dedicated Desk', value: 'dedicated-desk' },
                  { title: 'Private Office', value: 'private-office' }
                ]
              },
              validation: Rule => Rule.required()
            },
            {
              name: 'price',
              title: 'Price',
              type: 'number',
              validation: Rule => Rule.required().min(0)
            },
            {
              name: 'currency',
              title: 'Currency',
              type: 'string',
              initialValue: 'THB',
              validation: Rule => Rule.required()
            }
          ],
          validation: Rule => Rule.required()
        }
      ],
      validation: Rule => Rule.required().min(1).error('At least one pricing plan is required')
    },
    {
      name: 'internetSpeed',
      title: 'Internet Speed',
      type: 'object',
      fields: [
        {
          name: 'download',
          title: 'Download Speed (Mbps)',
          type: 'number',
          validation: Rule => Rule.required().min(1)
        },
        {
          name: 'upload',
          title: 'Upload Speed (Mbps)',
          type: 'number',
          validation: Rule => Rule.required().min(1)
        },
        {
          name: 'lastTested',
          title: 'Last Tested',
          type: 'datetime',
          validation: Rule => Rule.required()
        }
      ],
      validation: Rule => Rule.required()
    }
  ]
}

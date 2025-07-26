/**
 * Coworking Details schema for Sanity CMS
 * Used as an object type within the listing schema
 */
// eslint-disable-next-line no-unused-vars
import coworkingPricingPlan from './objects/coworkingPricingPlan';
// eslint-disable-next-line no-unused-vars
import openingHoursEntry from './objects/openingHoursEntry';

export default {
  name: 'coworkingDetails',
  title: 'Coworking Details',
  type: 'object',
  validation: Rule => Rule.required().error('Coworking details are required for coworking spaces'),
  fields: [
    { name: 'pricingPlans', type: 'array', of: [{ type: 'coworkingPricingPlan' }] },
    { name: 'openingHours', type: 'array', of: [{ type: 'openingHoursEntry' }] },
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

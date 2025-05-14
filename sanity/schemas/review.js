// Sanity schema for reviews
import { dateTimeWithInitial } from './shared/fields'

export default {
  name: 'review',
  title: 'Review',
  type: 'document',
  fields: [
    {
      name: 'listing',
      title: 'Listing',
      type: 'reference',
      to: [{ type: 'listing' }],
      validation: Rule => Rule.required(),
    },
    {
      name: 'user',
      title: 'User',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: Rule => Rule.required(),
    },
    {
      name: 'rating',
      title: 'Rating',
      type: 'number',
      validation: Rule => Rule.required().min(1).max(5),
    },
    {
      name: 'comment',
      title: 'Comment',
      type: 'text',
      validation: Rule => Rule.max(1000).warning('Keep reviews concise and helpful')
    },
    {
      ...dateTimeWithInitial
    },
    {
      name: 'approved',
      title: 'Approved',
      type: 'boolean',
      initialValue: false,
    }
  ]
}

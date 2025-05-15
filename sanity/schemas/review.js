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
      options: {
        list: [1, 2, 3, 4, 5].map(num => ({ title: Array(num).fill('⭐').join(''), value: num }))
      }
    },
    {
      name: 'title',
      title: 'Review Title',
      type: 'string',
      validation: Rule => Rule.max(100).warning('Keep titles concise')
    },
    {
      name: 'comment',
      title: 'Comment',
      type: 'text',
      validation: Rule => Rule
        .required()
        .min(10)
        .max(1000)
        .error('Review must be between 10 and 1000 characters')
    },
    {
      name: 'photos',
      title: 'Review Photos',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
      validation: Rule => Rule.max(5).warning('Maximum 5 photos per review')
    },
    {
      name: 'helpfulCount',
      title: 'Helpful Count',
      type: 'number',
      initialValue: 0,
      readOnly: true
    },
    {
      name: 'reportCount',
      title: 'Report Count',
      type: 'number',
      initialValue: 0,
      readOnly: true
    },
    {
      name: 'verified',
      title: 'Verified Stay',
      type: 'boolean',
      initialValue: false,
      description: 'Indicates if reviewer verifiably stayed at/used the venue'
    },
    {
      name: 'reply',
      title: 'Owner Reply',
      type: 'object',
      fields: [
        {
          name: 'content',
          title: 'Reply Content',
          type: 'text',
          validation: Rule => Rule.max(500).error('Reply must be under 500 characters')
        },
        {
          name: 'repliedAt',
          title: 'Replied At',
          type: 'datetime',
          readOnly: true,
          initialValue: () => new Date().toISOString()
        }
      ]
    },
    {
      ...dateTimeWithInitial
    },
    {
      name: 'approved',
      title: 'Approved',
      type: 'boolean',
      initialValue: false,
      description: 'Reviews must be approved by moderators before being public'
    },
    {
      name: 'moderationNotes',
      title: 'Moderation Notes',
      type: 'text',
      hidden: ({ document }) => document?.approved === true,
    }
  ],
  preview: {
    select: {
      title: 'user.name',
      subtitle: 'listing.name',
      rating: 'rating',
      approved: 'approved'
    },
    prepare(selection) {
      const { title, subtitle, rating, approved } = selection;
      const stars = Array(rating).fill('⭐').join('');
      return {
        title: `${title || 'Anonymous'} - ${stars}`,
        subtitle: `${subtitle || 'Unknown Listing'} ${approved ? '✓' : '(pending)'}`,
      };
    }
  }
}

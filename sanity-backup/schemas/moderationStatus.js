import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'moderationStatus',
  title: 'Moderation Status',
  type: 'document',
  fields: [
    defineField({
      name: 'item',
      title: 'Referenced Item',
      type: 'reference',
      to: [
        {type: 'listing'},
        {type: 'review'},
        {type: 'comment'},
      ]
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Pending Review', value: 'pending'},
          {title: 'Approved', value: 'approved'},
          {title: 'Rejected', value: 'rejected'},
          {title: 'Needs Changes', value: 'changes_needed'},
          {title: 'Flagged', value: 'flagged'},
        ]
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'moderatorNotes',
      title: 'Moderator Notes',
      type: 'text',
    }),
    defineField({
      name: 'moderatedBy',
      title: 'Moderated By',
      type: 'reference',
      to: [{type: 'user'}],
    }),
    defineField({
      name: 'moderatedAt',
      title: 'Moderated At',
      type: 'datetime',
    }),
    defineField({
      name: 'userReports',
      title: 'User Reports',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          {name: 'reportedBy', type: 'reference', to: [{type: 'user'}]},
          {name: 'reason', type: 'string'},
          {name: 'details', type: 'text'},
          {name: 'reportedAt', type: 'datetime'},
        ]
      }]
    }),
  ],
  preview: {
    select: {
      title: 'item.name',
      status: 'status',
      updatedAt: 'moderatedAt'
    },
    prepare({title, status, updatedAt}) {
      return {
        title: title || 'Unnamed Item',
        subtitle: `Status: ${status} | Last Updated: ${updatedAt ? new Date(updatedAt).toLocaleDateString() : 'Never'}`
      }
    }
  }
})

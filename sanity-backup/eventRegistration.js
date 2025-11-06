export default {
  name: 'eventRegistration',
  title: 'Event Registration',
  type: 'document',
  fields: [
    {
      name: 'event',
      title: 'Event',
      type: 'reference',
      to: [{type: 'event'}],
      validation: Rule => Rule.required()
    },
    {
      name: 'user',
      title: 'User',
      type: 'reference',
      to: [{type: 'user'}],
      validation: Rule => Rule.required()
    },
    {
      name: 'registrationDate',
      title: 'Registration Date',
      type: 'datetime',
      validation: Rule => Rule.required()
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Pending', value: 'pending'},
          {title: 'Confirmed', value: 'confirmed'},
          {title: 'Cancelled', value: 'cancelled'},
          {title: 'Attended', value: 'attended'}
        ]
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'notes',
      title: 'Notes',
      type: 'text'
    }
  ],
  preview: {
    select: {
      title: 'user.name',
      subtitle: 'event.title',
      status: 'status'
    },
    prepare({title, subtitle, status}) {
      return {
        title: title || 'Unnamed User',
        subtitle: `${subtitle || 'Unnamed Event'} (${status || 'unknown'})`
      }
    }
  }
}

// Sanity schema for comments
export default {
  name: 'comment',
  title: 'Comment',
  type: 'document',
  fields: [
    {
      name: 'post',
      title: 'Blog Post',
      type: 'reference',
      to: [{ type: 'blogPost' }],
      validation: Rule => Rule.required(),
    },
    {
      name: 'user',
      title: 'User',
      type: 'reference',
      to: [{ type: 'user' }],
    },
    {
      name: 'content',
      title: 'Content',
      type: 'text',
      validation: Rule => Rule.required(),
    },
    {
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      readOnly: true,
      initialValue: () => new Date().toISOString(),
    },
    {
      name: 'approved',
      title: 'Approved',
      type: 'boolean',
      initialValue: false,
    },
    {
      name: 'parent',
      title: 'Parent Comment',
      type: 'reference',
      to: [{ type: 'comment' }],
      description: 'If this is a reply, reference the parent comment.'
    }
  ]
}

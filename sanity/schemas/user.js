// Sanity schema for user profiles
export default {
  name: 'user',
  title: 'User',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: Rule => Rule.required(),
    },
    {
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: Rule => Rule
        .required()
        .email()
        .unique(), // Ensure email uniqueness
    },
    {
      name: 'avatar',
      title: 'Avatar',
      type: 'image',
      options: {
        hotspot: true,
        accept: 'image/jpeg,image/png,image/webp', // Restrict file types
        maxSize: 2 * 1024 * 1024 // 2MB max
      },
      validation: Rule => Rule.warning('Avatar recommended for better user recognition')
    },
    {
      name: 'bio',
      title: 'Bio',
      type: 'text',
      validation: Rule => Rule.max(500).warning('Keep bio concise')
    },
    {
      name: 'role',
      title: 'Role',
      type: 'string',
      options: {
        list: [
          { title: 'User', value: 'user' },
          { title: 'Editor', value: 'editor' },
          { title: 'Venue Owner', value: 'venueOwner' },
          { title: 'Admin', value: 'admin' }
        ]
      },
      initialValue: 'user',
    },
    {
      name: 'ownedListings',
      title: 'Owned Listings',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'listing' }] }],
      hidden: ({ document }) => document?.role !== 'venueOwner' && document?.role !== 'admin'
    },
    {
      name: 'reviews',
      title: 'Reviews',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'review' }] }],
      readOnly: true // Managed through reviews, not directly
    },
    {
      name: 'lastActive',
      title: 'Last Active',
      type: 'datetime',
      readOnly: true
    },
    {
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      readOnly: true,
      initialValue: () => new Date().toISOString(),
    }
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'email',
      media: 'avatar'
    }
  },
  indexes: [
    { name: 'byEmail', fields: ['email'] },
    { name: 'byRole', fields: ['role'] }
  ]
}

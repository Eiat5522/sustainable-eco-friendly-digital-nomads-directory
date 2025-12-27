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
      readOnly: true,
      isUnique: true, // Added isUnique flag
      validation: Rule => Rule.email(), // Removed .unique()
    },
    {
      name: 'avatar',
      title: 'Avatar',
      type: 'image',
      options: {
        hotspot: true,
        accept: 'image/jpeg,image/png,image/webp', // Restrict file types
        maxSize: 2 * 1024 * 1024, // 2MB max
      },
      validation: Rule => Rule.warning('Avatar recommended for better user recognition'),
    },
    {
      name: 'bio',
      title: 'Bio',
      type: 'text',
      validation: Rule => Rule.max(500).warning('Keep bio concise'),
    },
    {
      name: 'role',
      title: 'Role',
      type: 'string',
      readOnly: true,
      options: {
        list: [
          { title: 'User', value: 'user' },
          { title: 'Editor', value: 'editor' },
          { title: 'Venue Owner', value: 'venueOwner' },
          { title: 'Admin', value: 'admin' },
          { title: 'Super Admin', value: 'superAdmin' },
        ],
      },
      initialValue: 'user',
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      readOnly: true,
      options: {
        list: [
          { title: 'Active', value: 'active' },
          { title: 'Suspended', value: 'suspended' },
          { title: 'Pending', value: 'pending' },
        ],
      },
      initialValue: 'active',
    },
    {
      name: 'ownedListings',
      title: 'Owned Listings',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'listing' }] }],
    },
    {
      name: 'reviews',
      title: 'Reviews',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'review' }] }],
      readOnly: true, // Managed through reviews, not directly
    },
    {
      name: 'comments',
      title: 'Comments',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'comment' }], weak: true }],
      readOnly: true,
    },
    {
      name: 'lastActive',
      title: 'Last Active',
      type: 'datetime',
      readOnly: true,
    },
    {
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      readOnly: true,
      initialValue: () => new Date().toISOString(),
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'email',
      media: 'avatar',
    },
  },
  indexes: [
    { name: 'byEmail', fields: ['email'] },
  ],
};

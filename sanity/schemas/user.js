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
      isUnique: true, // Added isUnique flag
      validation: Rule => Rule.email(), // Removed .unique()
    },
    {
      name: 'mongodbId',
      title: 'MongoDB ID',
      type: 'string',
      readOnly: true,
      description: 'System-linked MongoDB user ID for cross-system syncing.',
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
      options: {
        list: [
          { title: 'User', value: 'user' },
          { title: 'Editor', value: 'editor' },
          { title: 'Author', value: 'author' },
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
    {
      name: 'listingQuotaTier',
      title: 'Listing Quota Tier',
      type: 'string',
      description: 'Optional human-friendly quota tier. Server maps tier -> default maxLocations.',
      options: {
        list: [
          { title: 'Free', value: 'free' },
          { title: 'Pro', value: 'pro' },
          { title: 'Enterprise', value: 'enterprise' },
        ],
      },
    },
    {
      name: 'maxLocations',
      title: 'Max Locations',
      type: 'number',
      description: 'Numeric override for number of listings this owner may have. If empty, tier mapping or global default applies.',
      validation: Rule => Rule.min(0),
    },
    {
      name: 'locationCount',
      title: 'Location Count (optional)',
      type: 'number',
      description: 'Optional cached count of owned listings. If present, used for quick reads but reconciled with authoritative queries.',
      readOnly: true,
    },
    {
      name: 'quotaOverrideByAdmin',
      title: 'Quota Override (admin)',
      type: 'boolean',
      description: 'When true an admin may bypass quota checks for this user.',
      initialValue: false,
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
    { name: 'byMongoId', fields: ['mongodbId'] },
  ],
};

import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'userFavorite',
  title: 'User Favorite',
  type: 'document',
  description: 'Tracks which listings users have favorited',
  fields: [
    defineField({
      name: 'user',
      title: 'User',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule) => Rule.required(),
      description: 'The user who favorited this listing',
    }),
    defineField({
      name: 'listing',
      title: 'Listing',
      type: 'reference',
      to: [{ type: 'listing' }],
      validation: (Rule) => Rule.required(),
      description: 'The listing that was favorited',
    }),
    defineField({
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
      description: 'When this favorite was created',
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: {
      userName: 'user.name',
      userEmail: 'user.email',
      listingName: 'listing.name',
      createdAt: 'createdAt',
    },
    prepare({ userName, userEmail, listingName, createdAt }) {
      const userDisplay = userName || userEmail || 'Unknown User';
      const listingDisplay = listingName || 'Unknown Listing';
      const date = createdAt ? new Date(createdAt).toLocaleDateString() : '';
      
      return {
        title: `${userDisplay} ♥ ${listingDisplay}`,
        subtitle: date ? `Favorited on ${date}` : 'Favorite',
      };
    },
  },
  orderings: [
    {
      title: 'Created Date (newest first)',
      name: 'createdAtDesc',
      by: [{ field: 'createdAt', direction: 'desc' }],
    },
    {
      title: 'Created Date (oldest first)',
      name: 'createdAtAsc',
      by: [{ field: 'createdAt', direction: 'asc' }],
    },
  ],
});
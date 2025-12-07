export default {
  name: 'listingAnalytics',
  title: 'Listing Analytics',
  type: 'document',
  fields: [
    {
      name: 'listing',
      title: 'Listing',
      type: 'reference',
      to: [{type: 'listing'}],
      validation: Rule => Rule.required()
    },
    {
      name: 'viewCount',
      title: 'View Count',
      type: 'number',
      validation: Rule => Rule.required().min(0)
    },
    {
      name: 'bookmarkCount',
      title: 'Bookmark Count',
      type: 'number',
      validation: Rule => Rule.required().min(0)
    },
    {
      name: 'clickThroughRate',
      title: 'Click Through Rate',
      type: 'number',
      validation: Rule => Rule.required().min(0).max(100)
    },
    {
      name: 'lastUpdated',
      title: 'Last Updated',
      type: 'datetime',
      validation: Rule => Rule.required()
    },
    {
      name: 'timeOnPage',
      title: 'Average Time on Page (seconds)',
      type: 'number',
      validation: Rule => Rule.required().min(0)
    }
  ],
  preview: {
    select: {
      title: 'listing.name',
      views: 'viewCount',
      bookmarks: 'bookmarkCount'
    },
    prepare({title, views, bookmarks}) {
      return {
        title: title || 'Unnamed Listing',
        subtitle: `Views: ${views || 0} | Bookmarks: ${bookmarks || 0}`
      }
    }
  }
}

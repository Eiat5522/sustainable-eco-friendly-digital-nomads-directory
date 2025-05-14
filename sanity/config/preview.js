/**
 * Preview Configuration for Sanity Studio
 * Defines preview configurations for different document types
 */

const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'

// Shared resolver functions
const getSlugUrl = (doc, type) => {
  if (!doc.slug?.current) return null
  return `${FRONTEND_URL}/${type}/${doc.slug.current}`
}

export const previewConfig = {
  // Listing previews
  listing: {
    select: {
      title: 'name',
      slug: 'slug.current',
      category: 'category',
      image: 'mainImage'
    },
    prepare(selection) {
      const { title, slug, category, image } = selection
      return {
        title,
        subtitle: `${category.charAt(0).toUpperCase() + category.slice(1)} Listing`,
        media: image,
        url: getSlugUrl({ slug: { current: slug } }, 'listings')
      }
    }
  },

  // Blog post previews
  blogPost: {
    select: {
      title: 'title',
      slug: 'slug.current',
      publishedAt: 'publishedAt',
      image: 'mainImage'
    },
    prepare(selection) {
      const { title, slug, publishedAt, image } = selection
      return {
        title,
        subtitle: publishedAt ? new Date(publishedAt).toLocaleDateString() : 'Draft',
        media: image,
        url: getSlugUrl({ slug: { current: slug } }, 'blog')
      }
    }
  },

  // Event previews
  event: {
    select: {
      title: 'title',
      slug: 'slug.current',
      startDate: 'startDate',
      image: 'image'
    },
    prepare(selection) {
      const { title, slug, startDate, image } = selection
      return {
        title,
        subtitle: startDate ? new Date(startDate).toLocaleDateString() : 'No date set',
        media: image,
        url: getSlugUrl({ slug: { current: slug } }, 'events')
      }
    }
  },

  // City previews
  city: {
    select: {
      title: 'name',
      slug: 'slug.current',
      image: 'image'
    },
    prepare(selection) {
      const { title, slug, image } = selection
      return {
        title,
        subtitle: 'City',
        media: image,
        url: getSlugUrl({ slug: { current: slug } }, 'cities')
      }
    }
  }
}

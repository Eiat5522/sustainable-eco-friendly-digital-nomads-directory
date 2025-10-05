export function normaliseFavorite(entry: any) {
  if (!entry?.listing?.slug) return null;

  return {
    id: entry._id,
    name: entry.listing.name?.trim() || 'Untitled listing',
    slug: entry.listing.slug,
    city: entry.listing.city?.name,
    imageUrl: entry.listing.mainImage?.asset?.url,
    createdAt: entry.createdAt,
  };
}

export function normaliseOwnerReviews(response: any) {
  if (!response?.listings) return [];

  return response.listings
    .map((listing: any) => {
      if (!listing.slug) return null;

      const reviews = listing.reviews
        ?.map((review: any) => {
          if (!review.id) return null;
          return {
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
            reviewerName: review.reviewerName,
            reviewerImage: review.reviewerImage,
          };
        })
        .filter(Boolean);

      return {
        slug: listing.slug,
        name: listing.name?.trim() || 'Untitled listing',
        reviews,
      };
    })
    .filter(Boolean);
}
const validatePlannedItinerary = itinerary => {
  if (!itinerary || typeof itinerary !== 'object' || Array.isArray(itinerary)) {
    throw new Error('plan_sustainable_workday did not return structuredContent.itinerary');
  }

  if (typeof itinerary.summary !== 'string' || itinerary.summary.length === 0) {
    throw new Error('itinerary.summary missing');
  }

  if (!Array.isArray(itinerary.stops)) {
    throw new Error('itinerary.stops missing');
  }

  if (!Array.isArray(itinerary.notices)) {
    throw new Error('itinerary.notices missing');
  }

  const explainsMissingListingData = itinerary.notices.some(notice => {
    const normalizedNotice = String(notice).toLowerCase();
    return (
      normalizedNotice.includes('published listings') ||
      normalizedNotice.includes('listing data') ||
      normalizedNotice.includes('no listings')
    );
  });

  if (itinerary.stops.length === 0 && !explainsMissingListingData) {
    throw new Error('Empty itineraries should explain why no stops were returned');
  }
};

module.exports = { validatePlannedItinerary };

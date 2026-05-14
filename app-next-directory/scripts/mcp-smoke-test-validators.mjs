export const validatePlannedItinerary = itinerary => {
  if (!itinerary || typeof itinerary !== 'object') {
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

  if (itinerary.stops.length === 0 && itinerary.notices.length === 0) {
    throw new Error('Empty itineraries should explain why no stops were returned');
  }
};

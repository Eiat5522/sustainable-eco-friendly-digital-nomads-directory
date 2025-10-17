import React from 'react';

export const mockFormSubmission = {
  name: 'Eco Hub',
  slug: { current: 'eco-hub' },
};

export const VenueListingForm = ({ listing, onSave, saving }: any) => (
  <div data-testid="venue-form">
    {listing ? <span data-testid="listing-name">{listing.name}</span> : null}
    <button type="button" disabled={saving} onClick={() => onSave(mockFormSubmission)}>
      trigger-save
    </button>
  </div>
);

export default VenueListingForm;

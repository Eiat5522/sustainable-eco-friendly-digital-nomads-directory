import React from 'react';

type VenueListingFormProps = {
  listing?: { name?: string } | null;
  onSave?: (values: unknown) => void;
  saving?: boolean;
};

export const mockFormSubmission = {
  name: 'Eco Hub',
  slug: { current: 'eco-hub' },
};

export const VenueListingForm = ({ listing, onSave, saving }: VenueListingFormProps) => (
  <div data-testid="venue-form">
    {listing ? <span data-testid="listing-name">{listing.name}</span> : null}
    <button type="button" disabled={saving} onClick={() => onSave?.(mockFormSubmission)}>
      trigger-save
    </button>
  </div>
);

export default VenueListingForm;

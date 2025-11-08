import type { ReactNode } from 'react';

import type { ListingDetailDTO } from '@/types/dto';

import { formatPrice } from './listingDetailMockData';

type ListingDetailSection = {
  title: string;
  content: ReactNode;
};

type CategoryRendererMap = {
  [Type in ListingDetailDTO['type']]?: (
    listing: Extract<ListingDetailDTO, { type: Type }>
  ) => ReactNode;
};

const CATEGORY_RENDERERS: CategoryRendererMap = {
  accommodation: ({ accommodationDetails }) => {
    if (!accommodationDetails) return null;

    const sections: ListingDetailSection[] = [];

    if (accommodationDetails.accommodationType) {
      sections.push({
        title: 'Type',
        content: accommodationDetails.accommodationType,
      });
    }

    if (accommodationDetails.pricePerNight) {
      sections.push({
        title: 'Price per night',
        content: formatPrice(
          accommodationDetails.pricePerNight.amount,
          accommodationDetails.pricePerNight.currency,
          accommodationDetails.pricePerNight.unit
        ),
      });
    }

    if (accommodationDetails.roomTypes && accommodationDetails.roomTypes.length > 0) {
      sections.push({
        title: 'Room Types',
        content: (
          <div className="flex flex-wrap gap-2 mt-2">
            {accommodationDetails.roomTypes.map((type, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-neo-secondary/20 text-neo-text-primary rounded-lg text-sm"
              >
                {type}
              </span>
            ))}
          </div>
        ),
      });
    }

    if (typeof accommodationDetails.minimumStay === 'number') {
      sections.push({
        title: 'Minimum stay',
        content: `${accommodationDetails.minimumStay} night${
          accommodationDetails.minimumStay > 1 ? 's' : ''
        }`,
      });
    }

    if (sections.length === 0) {
      return null;
    }

    return (
      <div className="space-y-4">
        <h3 className="heading-sm">Accommodation Details</h3>
        {sections.map(({ title, content }) => (
          <div key={title}>
            <span className="font-medium">{title}: </span>
            <span className="text-neo-text-secondary">{content}</span>
          </div>
        ))}
      </div>
    );
  },
  coworking: ({ coworkingDetails }) => {
    if (!coworkingDetails) return null;

    return (
      <div className="space-y-4">
        <h3 className="heading-sm">Coworking Details</h3>

        {coworkingDetails.pricingPlans && coworkingDetails.pricingPlans.length > 0 && (
          <div>
            <span className="font-medium">Pricing Plans:</span>
            <div className="space-y-2 mt-2">
              {coworkingDetails.pricingPlans.map((plan, index) => (
                <div key={`${plan.type}-${index}`} className="p-3 bg-neo-surface border border-neo-border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium">{plan.type}</span>
                      {plan.period ? (
                        <span className="text-sm text-neo-text-secondary ml-2">({plan.period})</span>
                      ) : null}
                    </div>
                    <span className="font-medium text-neo-primary">
                      {formatPrice(plan.price.amount, plan.price.currency, plan.price.unit)}
                    </span>
                  </div>
                  {plan.features && plan.features.length > 0 ? (
                    <ul className="text-sm text-neo-text-secondary mt-2 space-y-1">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={`${plan.type}-${featureIndex}`}>• {feature}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}

        {coworkingDetails.internetSpeed ? (
          <div>
            <span className="font-medium">Internet Speed: </span>
            <span className="text-neo-text-secondary">
              {coworkingDetails.internetSpeed.download}Mbps down / {coworkingDetails.internetSpeed.upload}Mbps up
            </span>
          </div>
        ) : null}
      </div>
    );
  },
  cafe: ({ cafeDetails }) => {
    if (!cafeDetails) return null;

    return (
      <div className="space-y-4">
        <h3 className="heading-sm">Cafe Details</h3>

        {cafeDetails.priceIndication ? (
          <div>
            <span className="font-medium">Price Range: </span>
            <span className="text-neo-text-secondary">{cafeDetails.priceIndication}</span>
          </div>
        ) : null}

        {cafeDetails.noiseLevel ? (
          <div>
            <span className="font-medium">Noise Level: </span>
            <span className="text-neo-text-secondary capitalize">
              {cafeDetails.noiseLevel.replace('_', ' ')}
            </span>
          </div>
        ) : null}

        {cafeDetails.menuHighlights && cafeDetails.menuHighlights.length > 0 ? (
          <div>
            <span className="font-medium">Menu Highlights:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {cafeDetails.menuHighlights.map((item, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-neo-secondary/20 text-neo-text-primary rounded-lg text-sm"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  },
  restaurant: ({ restaurantDetails }) => {
    if (!restaurantDetails) return null;

    return (
      <div className="space-y-4">
        <h3 className="heading-sm">Restaurant Details</h3>

        {restaurantDetails.cuisineType && restaurantDetails.cuisineType.length > 0 ? (
          <div>
            <span className="font-medium">Cuisine Types:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {restaurantDetails.cuisineType.map((cuisine, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-neo-secondary/20 text-neo-text-primary rounded-lg text-sm"
                >
                  {cuisine}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {restaurantDetails.dietaryOptions && restaurantDetails.dietaryOptions.length > 0 ? (
          <div>
            <span className="font-medium">Dietary Options:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {restaurantDetails.dietaryOptions.map((option, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium border border-green-200"
                >
                  {option}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {restaurantDetails.averageMealPrice ? (
          <div>
            <span className="font-medium">Average meal price: </span>
            <span className="text-neo-text-secondary">
              {formatPrice(
                restaurantDetails.averageMealPrice.amount,
                restaurantDetails.averageMealPrice.currency,
                restaurantDetails.averageMealPrice.unit
              )}
            </span>
          </div>
        ) : null}
      </div>
    );
  },
  activities: ({ activityDetails }) => {
    if (!activityDetails) return null;

    return (
      <div className="space-y-4">
        <h3 className="heading-sm">Activity Details</h3>

        {activityDetails.activityType ? (
          <div>
            <span className="font-medium">Activity Type: </span>
            <span className="text-neo-text-secondary">{activityDetails.activityType}</span>
          </div>
        ) : null}

        {activityDetails.duration ? (
          <div>
            <span className="font-medium">Duration: </span>
            <span className="text-neo-text-secondary">{activityDetails.duration}</span>
          </div>
        ) : null}

        {activityDetails.skillLevel ? (
          <div>
            <span className="font-medium">Skill Level: </span>
            <span className="text-neo-text-secondary">{activityDetails.skillLevel}</span>
          </div>
        ) : null}

        {activityDetails.languages && activityDetails.languages.length > 0 ? (
          <div>
            <span className="font-medium">Languages:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {activityDetails.languages.map((language, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-neo-secondary/20 text-neo-text-primary rounded-lg text-sm"
                >
                  {language}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  },
};

export interface ListingCategoryDetailsProps {
  listing: ListingDetailDTO;
}

export function resolveCategoryDetails(listing: ListingDetailDTO): ReactNode | null {
  const renderer = CATEGORY_RENDERERS[listing.type];
  if (!renderer) {
    return null;
  }

  return renderer(listing as never) ?? null;
}

export function ListingCategoryDetails({ listing }: ListingCategoryDetailsProps) {
  return resolveCategoryDetails(listing);
}


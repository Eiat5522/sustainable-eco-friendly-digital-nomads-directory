import React from 'react';
import { Phone, Mail, Globe, MapPin } from 'lucide-react';
import { NeoCard, NeoCardHeader, NeoCardTitle, NeoCardContent } from '@/components/ui/neo-card';
import { NeoButton } from '@/components/ui/neo-button';
import { Separator } from '@/components/ui/separator';
import { InteractiveMap } from '@/components/ui/InteractiveMap';
import type { ListingDetailDTO } from '@/types/dto';
import { formatPrice } from '../listings/listingDetailMockData';

interface ListingDetailsCardProps {
  listing: ListingDetailDTO;
}

export function ListingDetailsCard({ listing }: ListingDetailsCardProps) {
  const renderCategoryDetails = () => {
    switch (listing.type) {
      case 'accommodation':
        if (!listing.accommodationDetails) return null;
        return (
          <div className="space-y-4">
            <h3 className="heading-sm">Accommodation Details</h3>
            
            {listing.accommodationDetails.accommodationType && (
              <div>
                <span className="font-medium">Type: </span>
                <span className="text-neo-text-secondary">{listing.accommodationDetails.accommodationType}</span>
              </div>
            )}
            
            {listing.accommodationDetails.pricePerNight && (
              <div>
                <span className="font-medium">Price per night: </span>
                <span className="text-neo-text-secondary">
                  {formatPrice(
                    listing.accommodationDetails.pricePerNight.amount,
                    listing.accommodationDetails.pricePerNight.currency,
                    listing.accommodationDetails.pricePerNight.unit
                  )}
                </span>
              </div>
            )}
            
            {listing.accommodationDetails.roomTypes && listing.accommodationDetails.roomTypes.length > 0 && (
              <div>
                <span className="font-medium">Room Types: </span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {listing.accommodationDetails.roomTypes.map((type, index) => (
                    <span key={index} className="px-3 py-1 bg-neo-secondary/20 text-neo-text-primary rounded-lg text-sm">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {listing.accommodationDetails.minimumStay && (
              <div>
                <span className="font-medium">Minimum stay: </span>
                <span className="text-neo-text-secondary">
                  {listing.accommodationDetails.minimumStay} night{listing.accommodationDetails.minimumStay > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        );

      case 'coworking':
        if (!listing.coworkingDetails) return null;
        return (
          <div className="space-y-4">
            <h3 className="heading-sm">Coworking Details</h3>
            
            {listing.coworkingDetails.pricingPlans && listing.coworkingDetails.pricingPlans.length > 0 && (
              <div>
                <span className="font-medium">Pricing Plans:</span>
                <div className="space-y-2 mt-2">
                  {listing.coworkingDetails.pricingPlans.map((plan, index) => (
                    <div key={index} className="p-3 bg-neo-surface border border-neo-border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium">{plan.type}</span>
                          <span className="text-sm text-neo-text-secondary ml-2">({plan.period})</span>
                        </div>
                        <span className="font-medium text-neo-primary">
                          {formatPrice(plan.price.amount, plan.price.currency, plan.price.unit)}
                        </span>
                      </div>
                      {plan.features && plan.features.length > 0 && (
                        <ul className="text-sm text-neo-text-secondary mt-2 space-y-1">
                          {plan.features.map((feature, featureIndex) => (
                            <li key={featureIndex}>• {feature}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {listing.coworkingDetails.internetSpeed && (
              <div>
                <span className="font-medium">Internet Speed: </span>
                <span className="text-neo-text-secondary">
                  {listing.coworkingDetails.internetSpeed.download}Mbps down / {listing.coworkingDetails.internetSpeed.upload}Mbps up
                </span>
              </div>
            )}
          </div>
        );

      case 'cafe':
        if (!listing.cafeDetails) return null;
        return (
          <div className="space-y-4">
            <h3 className="heading-sm">Cafe Details</h3>
            
            {listing.cafeDetails.priceIndication && (
              <div>
                <span className="font-medium">Price Range: </span>
                <span className="text-neo-text-secondary">{listing.cafeDetails.priceIndication}</span>
              </div>
            )}
            
            {listing.cafeDetails.noiseLevel && (
              <div>
                <span className="font-medium">Noise Level: </span>
                <span className="text-neo-text-secondary capitalize">{listing.cafeDetails.noiseLevel.replace('_', ' ')}</span>
              </div>
            )}
            
            {listing.cafeDetails.menuHighlights && listing.cafeDetails.menuHighlights.length > 0 && (
              <div>
                <span className="font-medium">Menu Highlights:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {listing.cafeDetails.menuHighlights.map((item, index) => (
                    <span key={index} className="px-3 py-1 bg-neo-secondary/20 text-neo-text-primary rounded-lg text-sm">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Main Details Card */}
      <NeoCard variant="elevated">
        <NeoCardHeader>
          <NeoCardTitle>About This Place</NeoCardTitle>
        </NeoCardHeader>
        
        <NeoCardContent className="space-y-6">
          {/* Description */}
          {listing.longDescription && (
            <div>
              <p className="body-md text-neo-text-secondary leading-relaxed">
                {listing.longDescription}
              </p>
            </div>
          )}

          <Separator />

          {/* Amenities */}
          {listing.amenities && listing.amenities.length > 0 && (
            <div>
              <h3 className="heading-sm mb-4">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {listing.amenities.map((amenity) => (
                  <span 
                    key={amenity.id}
                    className="px-3 py-2 bg-neo-success/20 text-neo-success rounded-lg text-sm font-medium border border-neo-success/30"
                  >
                    {amenity.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Eco Focus Tags */}
          {listing.ecoFocusTags && listing.ecoFocusTags.length > 0 && (
            <div>
              <h3 className="heading-sm mb-4">Sustainability Features</h3>
              <div className="flex flex-wrap gap-2">
                {listing.ecoFocusTags.map((tag, index) => (
                  <span 
                    key={index}
                    className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium border border-green-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Digital Nomad Features */}
          {listing.digitalNomadFeatures && listing.digitalNomadFeatures.length > 0 && (
            <div>
              <h3 className="heading-sm mb-4">Digital Nomad Features</h3>
              <div className="flex flex-wrap gap-2">
                {listing.digitalNomadFeatures.map((feature, index) => (
                  <span 
                    key={index}
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium border border-blue-200"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Category-specific Details */}
          {renderCategoryDetails()}
        </NeoCardContent>
      </NeoCard>

      {/* Contact Information Card */}
      <NeoCard variant="elevated">
        <NeoCardHeader>
          <NeoCardTitle>Contact Information</NeoCardTitle>
        </NeoCardHeader>
        
        <NeoCardContent className="space-y-4">
          {listing.address && (
            <div className="flex items-start gap-3">
              <MapPin size={20} className="text-neo-text-secondary mt-1" />
              <div>
                <span className="font-medium">Address</span>
                <p className="text-neo-text-secondary text-sm mt-1">{listing.address}</p>
              </div>
            </div>
          )}

          {listing.contactPhone && (
            <div className="flex items-center gap-3">
              <Phone size={20} className="text-neo-text-secondary" />
              <div className="flex-1">
                <span className="font-medium">Phone</span>
                <p className="text-neo-text-secondary text-sm">{listing.contactPhone}</p>
              </div>
              <NeoButton variant="outline" size="sm" asChild>
                <a href={`tel:${listing.contactPhone}`}>Call</a>
              </NeoButton>
            </div>
          )}

          {listing.contactEmail && (
            <div className="flex items-center gap-3">
              <Mail size={20} className="text-neo-text-secondary" />
              <div className="flex-1">
                <span className="font-medium">Email</span>
                <p className="text-neo-text-secondary text-sm">{listing.contactEmail}</p>
              </div>
              <NeoButton variant="outline" size="sm" asChild>
                <a href={`mailto:${listing.contactEmail}`}>Email</a>
              </NeoButton>
            </div>
          )}

          {listing.website && (
            <div className="flex items-center gap-3">
              <Globe size={20} className="text-neo-text-secondary" />
              <div className="flex-1">
                <span className="font-medium">Website</span>
                <p className="text-neo-text-secondary text-sm">{listing.website}</p>
              </div>
              <NeoButton variant="outline" size="sm" asChild>
                <a href={listing.website} target="_blank" rel="noopener noreferrer">Visit</a>
              </NeoButton>
            </div>
          )}
        </NeoCardContent>
      </NeoCard>

      {/* Map Card */}
      <NeoCard variant="elevated">
        <NeoCardHeader>
          <NeoCardTitle>Location</NeoCardTitle>
        </NeoCardHeader>
        
        <NeoCardContent>
          <InteractiveMap
            location={listing.location}
            address={listing.address}
            name={listing.name}
            className="w-full"
          />
        </NeoCardContent>
      </NeoCard>
    </div>
  );
}
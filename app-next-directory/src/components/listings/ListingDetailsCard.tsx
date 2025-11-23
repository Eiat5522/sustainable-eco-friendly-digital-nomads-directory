'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';
import { Fragment, useId, useMemo, useState } from 'react';

import { NeoCard, NeoCardContent, NeoCardHeader, NeoCardTitle } from '@/components/ui/neo-card';
import { Separator } from '@/components/ui/separator';
// Use a dynamic import to avoid SSR conflicts with map dependencies.
import type { ListingDetailDTO } from '@/types/dto';

import { resolveCategoryDetails } from './ListingCategoryDetails';
import { ListingContactInfo } from './ListingContactInfo';

const InteractiveMap = dynamic(
  () => import('@/components/ui/InteractiveMap').then(m => m.InteractiveMap),
  { ssr: false }
);

interface PillItem {
  key: string;
  label: string;
}

interface PillSectionConfig {
  id: string;
  title: string;
  items: PillItem[];
  pillClassName: string;
}

interface ListingDetailsCardProps {
  listing: ListingDetailDTO;
}

export function ListingDetailsCard({ listing }: Readonly<ListingDetailsCardProps>) {
  const descriptionId = useId();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const shouldTruncateDescription = useMemo(() => {
    if (!listing.longDescription) return false;
    // Use a conservative threshold to avoid showing the toggle for short blurbs.
    return listing.longDescription.trim().length > 260;
  }, [listing.longDescription]);

  const handleToggleDescription = () => {
    setIsDescriptionExpanded(prev => !prev);
  };

  return (
    <div className="space-y-8">
      {/* Main Details Card */}
      <NeoCard variant="elevated">
        <NeoCardHeader>
          <NeoCardTitle>About This Place</NeoCardTitle>
        </NeoCardHeader>

        <NeoCardContent className="space-y-6">
          {renderSections({
            listing,
            descriptionId,
            isDescriptionExpanded,
            onToggleDescription: handleToggleDescription,
            shouldTruncateDescription,
          }).map(({ id, content }, index, sections) => (
            <Fragment key={id}>
              {content}
              {index < sections.length - 1 ? <Separator /> : null}
            </Fragment>
          ))}
        </NeoCardContent>
      </NeoCard>

      {/* Contact Information Card */}
      <NeoCard variant="elevated">
        <NeoCardHeader>
          <NeoCardTitle>Contact Information</NeoCardTitle>
        </NeoCardHeader>

        <NeoCardContent>
          <ListingContactInfo listing={listing} />
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

interface RenderSectionsArgs {
  listing: ListingDetailDTO;
  descriptionId: string;
  isDescriptionExpanded: boolean;
  shouldTruncateDescription: boolean;
  onToggleDescription: () => void;
}

function renderSections({
  listing,
  descriptionId,
  isDescriptionExpanded,
  shouldTruncateDescription,
  onToggleDescription,
}: RenderSectionsArgs): Array<{ id: string; content: ReactNode }> {
  const sections: Array<{ id: string; content: ReactNode }> = [];

  if (listing.longDescription) {
    sections.push({
      id: 'description',
      content: (
        <DescriptionSection
          description={listing.longDescription}
          descriptionId={descriptionId}
          isExpanded={isDescriptionExpanded}
          onToggle={onToggleDescription}
          shouldTruncate={shouldTruncateDescription}
        />
      ),
    });
  }

  const pillSections = buildPillSections(listing);
  pillSections.forEach(section => {
    if (section.items.length > 0) {
      sections.push({
        id: section.id,
        content: (
          <PillSection
            title={section.title}
            items={section.items}
            pillClassName={section.pillClassName}
          />
        ),
      });
    }
  });

  const categoryDetailsContent = resolveCategoryDetails(listing);
  if (categoryDetailsContent) {
    sections.push({ id: 'category-details', content: categoryDetailsContent });
  }

  return sections;
}

function buildPillSections(listing: ListingDetailDTO): PillSectionConfig[] {
  const amenityItems: PillItem[] = (listing.amenities ?? []).map(amenity => ({
    key: amenity.id,
    label: amenity.name,
  }));

  const ecoItems: PillItem[] = (listing.ecoFocusTags ?? []).map((tag, index) => ({
    key: `${tag}-${index}`,
    label: tag,
  }));

  const digitalItems: PillItem[] = (listing.digitalNomadFeatures ?? []).map((feature, index) => ({
    key: `${feature}-${index}`,
    label: feature,
  }));

  return [
    {
      id: 'amenities',
      title: 'Amenities',
      items: amenityItems,
      pillClassName:
        'px-3 py-2 bg-neo-success/20 text-neo-success rounded-lg text-sm font-medium border border-neo-success/30',
    },
    {
      id: 'eco-features',
      title: 'Sustainability Features',
      items: ecoItems,
      pillClassName:
        'px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium border border-green-200',
    },
    {
      id: 'digital-features',
      title: 'Digital Nomad Features',
      items: digitalItems,
      pillClassName:
        'px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium border border-blue-200',
    },
  ];
}

interface DescriptionSectionProps {
  description: string;
  descriptionId: string;
  isExpanded: boolean;
  shouldTruncate: boolean;
  onToggle: () => void;
}

function DescriptionSection({
  description,
  descriptionId,
  isExpanded,
  shouldTruncate,
  onToggle,
}: DescriptionSectionProps) {
  return (
    <div>
      <div
        id={descriptionId}
        data-testid="long-description"
        data-expanded={isExpanded}
        className={`relative body-md text-neo-text-secondary leading-relaxed transition-[max-height] duration-300 ${
          shouldTruncate && !isExpanded ? 'max-h-32 overflow-hidden pr-1' : 'max-h-none'
        }`}
      >
        <p className="whitespace-pre-line">{description}</p>
        {shouldTruncate && !isExpanded ? (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-neo-surface via-neo-surface/80 to-transparent"
            aria-hidden="true"
          />
        ) : null}
      </div>
      {shouldTruncate ? (
        <button
          type="button"
          data-testid="read-more-button"
          aria-expanded={isExpanded}
          aria-controls={descriptionId}
          onClick={onToggle}
          className="mt-3 text-sm font-semibold text-neo-primary hover:text-neo-primary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary focus-visible:ring-offset-2"
        >
          {isExpanded ? 'Read less' : 'Read more'}
        </button>
      ) : null}
    </div>
  );
}

interface PillSectionProps {
  title: string;
  items: PillItem[];
  pillClassName: string;
}

function PillSection({ title, items, pillClassName }: PillSectionProps) {
  return (
    <section>
      <h3 className="heading-sm mb-4">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {items.map(({ key, label }) => (
          <span key={key} className={pillClassName}>
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}

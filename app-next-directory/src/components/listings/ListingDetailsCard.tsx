import type { ReactNode } from 'react';
import { Fragment, Suspense } from 'react';

import { NeoCard, NeoCardContent, NeoCardHeader, NeoCardTitle } from '@/components/ui/neo-card';
import { Separator } from '@/components/ui/separator';
import type { ListingDetailDTO } from '@/types/dto';

import { resolveCategoryDetails } from './ListingCategoryDetails';
import { ListingContactInfo } from './ListingContactInfo';
import { ListingLongDescription } from './ListingLongDescription';
import { ListingMapClient } from './ListingMapClient';

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
          <ListingMapClient
            location={listing.location}
            address={listing.address}
            name={listing.name}
          />
        </NeoCardContent>
      </NeoCard>
    </div>
  );
}

interface RenderSectionsArgs {
  listing: ListingDetailDTO;
}

function renderSections({
  listing,
}: RenderSectionsArgs): Array<{ id: string; content: ReactNode }> {
  const sections: Array<{ id: string; content: ReactNode }> = [];

  if (listing.longDescription) {
    sections.push({
      id: 'description',
      content: (
        <Suspense
          fallback={
            <>
              <div
                className="min-h-24 w-full rounded-lg bg-muted animate-pulse"
                aria-hidden="true"
              />
              <span className="sr-only" role="status" aria-live="polite">
                Loading description…
              </span>
            </>
          }
        >
          <ListingLongDescription description={listing.longDescription} />
        </Suspense>
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
        'px-3 py-2 bg-neo-success/20 text-neo-success rounded-lg text-sm font-medium border border-neo-success/40',
    },
    {
      id: 'digital-features',
      title: 'Digital Nomad Features',
      items: digitalItems,
      pillClassName:
        'px-3 py-2 bg-neo-primary/15 text-neo-primary rounded-lg text-sm font-medium border border-neo-primary/35',
    },
  ];
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

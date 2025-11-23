import type { LucideIcon } from 'lucide-react';
import { Globe, Mail, MapPin, Phone } from 'lucide-react';

import { NeoButton } from '@/components/ui/neo-button';
import type { ListingDetailDTO } from '@/types/dto';

type ContactItem = {
  key: string;
  icon: LucideIcon;
  label: string;
  value?: string | null;
  button?: { href: string; label: string };
  iconClassName?: string;
  valueClassName?: string;
  alignTop?: boolean;
};

export interface ListingContactInfoProps {
  listing: ListingDetailDTO;
}

export function ListingContactInfo({ listing }: ListingContactInfoProps) {
  const items: ContactItem[] = [
    {
      key: 'address',
      icon: MapPin,
      label: 'Address',
      value: listing.address,
      iconClassName: 'text-neo-text-secondary mt-1',
      valueClassName: 'text-neo-text-secondary text-sm mt-1',
      alignTop: true,
    },
    {
      key: 'phone',
      icon: Phone,
      label: 'Phone',
      value: listing.contactPhone,
      iconClassName: 'text-neo-text-secondary',
      valueClassName: 'text-neo-text-secondary text-sm',
      button: listing.contactPhone
        ? {
            href: `tel:${listing.contactPhone}`,
            label: 'Call',
          }
        : undefined,
    },
    {
      key: 'email',
      icon: Mail,
      label: 'Email',
      value: listing.contactEmail,
      iconClassName: 'text-neo-text-secondary',
      valueClassName: 'text-neo-text-secondary text-sm',
      button: listing.contactEmail
        ? {
            href: `mailto:${listing.contactEmail}`,
            label: 'Email',
          }
        : undefined,
    },
    {
      key: 'website',
      icon: Globe,
      label: 'Website',
      value: listing.website,
      iconClassName: 'text-neo-text-secondary',
      valueClassName: 'text-neo-text-secondary text-sm',
      button: listing.website
        ? {
            href: listing.website,
            label: 'Visit',
          }
        : undefined,
    },
  ];

  const visibleItems = items.filter(item => Boolean(item.value));
  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {visibleItems.map(
        ({ key, icon: Icon, label, value, button, iconClassName, valueClassName, alignTop }) => (
          <div key={key} className={`flex ${alignTop ? 'items-start' : 'items-center'} gap-3`}>
            <Icon size={20} className={iconClassName ?? 'text-neo-text-secondary'} />
            <div className="flex-1">
              <span className="font-medium">{label}</span>
              <p className={valueClassName ?? 'text-neo-text-secondary text-sm'}>{value}</p>
            </div>
            {button ? (
              <NeoButton variant="outline" size="sm" asChild>
                <a
                  href={button.href}
                  target={button.label === 'Visit' ? '_blank' : undefined}
                  rel={button.label === 'Visit' ? 'noopener noreferrer' : undefined}
                >
                  {button.label}
                </a>
              </NeoButton>
            ) : null}
          </div>
        )
      )}
    </div>
  );
}

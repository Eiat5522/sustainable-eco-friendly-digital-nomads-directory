import { permanentRedirect } from 'next/navigation';

type Props = {
  params: { slug: string };
};

// Legacy alias: /city/[slug] → /cities/[slug]
export default function LegacyCityAlias({ params }: Props) {
  permanentRedirect(`/cities/${encodeURIComponent(params.slug)}`);
}

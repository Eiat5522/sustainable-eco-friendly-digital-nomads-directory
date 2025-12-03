import { permanentRedirect } from 'next/navigation';

type Props = {
  params: Promise<{ slug: string }>;
};

// Legacy alias: /city/[slug] → /cities/[slug]
export default async function LegacyCityAlias(props: Props) {
  const params = await props.params;
  permanentRedirect(`/cities/${encodeURIComponent(params.slug)}`);
}

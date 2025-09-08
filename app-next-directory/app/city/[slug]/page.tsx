import { redirect } from 'next/navigation';

// Legacy alias: /city/[slug] → /cities/[slug]
export default function LegacyCityAlias({ params }: { params: { slug: string } }) {
  redirect(`/cities/${params.slug}`);
}

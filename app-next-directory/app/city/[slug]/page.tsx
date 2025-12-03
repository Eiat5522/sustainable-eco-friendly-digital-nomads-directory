import { permanentRedirect } from 'next/navigation';

type Params = { slug: string };
type Props = {
  params: Params | Promise<Params>;
};

// Legacy alias: /city/[slug] → /cities/[slug]
export default async function LegacyCityAlias(props: Props) {
  const params = props.params instanceof Promise ? await props.params : props.params;
  permanentRedirect(`/cities/${encodeURIComponent(params.slug)}`);
}

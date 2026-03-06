import { redirect } from 'next/navigation';

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function LegacyCategoryDetailRedirect({ params }: Props) {
  const { slug } = await params;
  redirect(`/categories/${slug}`);
}

import Link from 'next/link';
import { PageLayoutServer } from '@/components/layout/PageLayoutServer';
import { NeoButton } from '@/components/ui/neo-button';
import { NeoCard, NeoCardContent, NeoCardHeader, NeoCardTitle } from '@/components/ui/neo-card';

export default function NotFound() {
  return (
    <PageLayoutServer showFooterNewsletter={false}>
      <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-4 py-16">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-neo-secondary/20 via-transparent to-neo-primary/15" />
        <NeoCard variant="elevated" className="relative max-w-lg w-full text-center">
          <NeoCardHeader>
            <NeoCardTitle className="heading-xl mb-2 text-neo-text-primary">
              404 - Page Not Found
            </NeoCardTitle>
          </NeoCardHeader>
          <NeoCardContent>
            <p className="text-xl font-semibold text-neo-text-primary mb-6">
              Sorry, we couldn&apos;t find the page you&apos;re looking for.
            </p>
            <NeoButton asChild variant="primary" size="lg">
              <Link href="/">Go back home</Link>
            </NeoButton>
          </NeoCardContent>
        </NeoCard>
      </section>
    </PageLayoutServer>
  );
}

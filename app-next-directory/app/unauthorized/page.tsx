import Link from 'next/link';
import { PageLayout } from '@/components/layout/PageLayout';
import { NeoButton } from '@/components/ui/neo-button';
import { NeoCard, NeoCardContent, NeoCardHeader, NeoCardTitle } from '@/components/ui/neo-card';

export default function UnauthorizedPage() {
  return (
    <PageLayout showFooterNewsletter={false}>
      <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-4 py-16">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-neo-primary/15 via-transparent to-neo-secondary/20" />
        <NeoCard variant="elevated" className="relative max-w-lg w-full text-center">
          <NeoCardHeader>
            <NeoCardTitle className="heading-xl mb-2 text-neo-text-primary">
              Access denied
            </NeoCardTitle>
          </NeoCardHeader>
          <NeoCardContent>
            <p className="text-lg font-semibold text-neo-text-primary mb-6">
              You do not have permission to view this page.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <NeoButton asChild variant="primary" size="lg">
                <Link href="/auth/login">Sign in</Link>
              </NeoButton>
              <NeoButton asChild variant="secondary" size="lg">
                <Link href="/">Go back home</Link>
              </NeoButton>
            </div>
          </NeoCardContent>
        </NeoCard>
      </section>
    </PageLayout>
  );
}

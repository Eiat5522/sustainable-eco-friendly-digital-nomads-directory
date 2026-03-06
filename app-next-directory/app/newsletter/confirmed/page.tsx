import { Suspense } from 'react';
import { PageLayoutServer } from '@/components/layout/PageLayoutServer';
import { NewsletterConfirmedContent } from './NewsletterConfirmedContent';

export default function NewsletterConfirmedPage() {
  return (
    <PageLayoutServer>
      <Suspense fallback={<div>Loading...</div>}>
        <NewsletterConfirmedContent />
      </Suspense>
    </PageLayoutServer>
  );
}

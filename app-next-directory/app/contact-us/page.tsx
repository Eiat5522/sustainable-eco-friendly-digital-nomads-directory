import { Suspense } from 'react';
import { PageLayoutServer } from '@/components/layout/PageLayoutServer';
import { ContactUsContent } from './ContactUsContent';

export default function ContactUsPage() {
  return (
    <PageLayoutServer>
      <Suspense fallback={<div>Loading...</div>}>
        <ContactUsContent />
      </Suspense>
    </PageLayoutServer>
  );
}

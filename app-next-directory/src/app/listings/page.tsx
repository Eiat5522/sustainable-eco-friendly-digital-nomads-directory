import { Suspense } from 'react';
import ListingsPageContent from './ListingsPageContent';

export default function ListingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ListingsPageContent />
    </Suspense>
  );
}
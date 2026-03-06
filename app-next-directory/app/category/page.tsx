import { redirect } from 'next/navigation';

export default function LegacyCategoryIndexRedirect() {
  redirect('/categories');
}

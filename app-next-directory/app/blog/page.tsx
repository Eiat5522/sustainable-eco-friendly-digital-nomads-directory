import type { Metadata } from 'next';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import BlogPageWrapper from './BlogPageWrapper';

export const metadata: Metadata = {
  title: "The Nomad's Chronicle – Blog",
  description: 'Stories, tips, and sustainability insights for digital nomads.',
};

export default function BlogPage() {
  return (
    <>
      <Header />
      <BlogPageWrapper />
      <Footer />
    </>
  );
}

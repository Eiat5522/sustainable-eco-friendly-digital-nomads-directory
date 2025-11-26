import type { Metadata } from 'next';
import BlogPageWrapper from './BlogPageWrapper';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

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

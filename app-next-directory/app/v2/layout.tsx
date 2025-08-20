import React from 'react';

export default function V2Layout({ children }: { children: React.ReactNode }) {
  // Inherit global styles from app/layout via nested route
  return (
    <section className="min-h-screen bg-white dark:bg-gray-900">
      {children}
    </section>
  );
}

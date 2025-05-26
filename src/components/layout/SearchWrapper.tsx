'use client';

import { SearchDialog } from '@/components/search/SearchDialog';
import { MainNav } from '@/components/navigation/MainNav';
import { useState } from 'react';

export function SearchWrapper() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <MainNav onSearchClick={() => setIsSearchOpen(true)} />
      <SearchDialog isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}

'use client';

import { useSession } from "next-auth/react";
import { ReactNode, createContext, useContext } from "react";
import { UserRole } from "../../types/auth";

interface SearchContextType {
  isAuthenticated: boolean;
  userRole: UserRole;
  canCreateListings: boolean;
  canEditListings: boolean;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

interface SearchWrapperProps {
  children: ReactNode;
}

/**
 * Wrapper component that provides search-related authentication context
 */
export default function SearchWrapper({ children }: SearchWrapperProps) {
  const { data: session } = useSession();
  
  const user = session?.user;
  const userRole = (user as any)?.role as UserRole || 'unidentifiedUser';
  const isAuthenticated = !!session;

  // Define search-related permissions based on user role
  const canCreateListings = userRole === 'admin' || userRole === 'superAdmin' || userRole === 'venueOwner' || userRole === 'editor';
  const canEditListings = userRole === 'admin' || userRole === 'superAdmin' || userRole === 'moderator' || userRole === 'editor';

  const contextValue: SearchContextType = {
    isAuthenticated,
    userRole,
    canCreateListings,
    canEditListings,
  };

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
}

/**
 * Hook to use search authentication context
 */
export function useSearchAuth() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearchAuth must be used within a SearchWrapper');
  }
  return context;
}

import type { UserRole } from '@/types/auth';

export type UserListItem = {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  createdAt: string;
  lastActiveAt: string | null;
  status: 'active' | 'inactive';
};

export type UsersResponse = {
  users: UserListItem[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters: {
    search: string | null;
    role: UserRole | null;
  };
};

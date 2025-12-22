/**
 * Content moderation / editor role types and permissions.
 *
 * NOTE: 'moderator' role was removed in favor of a single `editor` role
 * for content management. Editors have CRUD permissions for listings.
 */
export type ModeratorRole = 'admin' | 'editor' | 'reviewer';

export interface Moderator {
  id: string;
  email: string;
  role: ModeratorRole;
  name: string;
  assignedCategories?: string[];
  actionsCount: {
    approved: number;
    rejected: number;
    flagged: number;
  };
  lastActive: Date;
}

export interface ModeratorPermissions {
  canApproveListings: boolean;
  canRejectListings: boolean;
  canEditListings: boolean;
  canCreateListings: boolean;
  canDeleteListings: boolean;
  canManageModerators: boolean;
  canUpdateGuidelines: boolean;
  canViewReports: boolean;
  canAssignReports: boolean;
}

export const getRolePermissions = (role: ModeratorRole | string): ModeratorPermissions => {
  // Accept legacy 'moderator' string as alias for 'editor' to maintain compatibility
  const normalizedRole = role === 'moderator' ? 'editor' : (role as ModeratorRole);
  switch (normalizedRole) {
    case 'admin':
      return {
        canApproveListings: true,
        canRejectListings: true,
        canEditListings: true,
        canCreateListings: true,
        canDeleteListings: true,
        canManageModerators: true,
        canUpdateGuidelines: true,
        canViewReports: true,
        canAssignReports: true,
      };
    case 'editor':
      return {
        // Editors have full CRUD over listings and moderation actions
        canApproveListings: true,
        canRejectListings: true,
        canEditListings: true,
        canCreateListings: true,
        canDeleteListings: true,
        canManageModerators: false,
        canUpdateGuidelines: false,
        canViewReports: true,
        canAssignReports: true,
      };
    case 'reviewer':
      return {
        canApproveListings: false,
        canRejectListings: false,
        canEditListings: false,
        canCreateListings: false,
        canDeleteListings: false,
        canManageModerators: false,
        canUpdateGuidelines: false,
        canViewReports: true,
        canAssignReports: false,
      };
  }
};

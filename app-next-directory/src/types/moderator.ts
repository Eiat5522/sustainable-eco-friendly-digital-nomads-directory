export type ModeratorRole = 'admin' | 'moderator' | 'reviewer';

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
  canManageModerators: boolean;
  canUpdateGuidelines: boolean;
  canViewReports: boolean;
  canAssignReports: boolean;
}

export const getRolePermissions = (role: ModeratorRole): ModeratorPermissions => {
  switch (role) {
    case 'admin':
      return {
        canApproveListings: true,
        canRejectListings: true,
        canEditListings: true,
        canManageModerators: true,
        canUpdateGuidelines: true,
        canViewReports: true,
        canAssignReports: true,
      };
    case 'moderator':
      return {
        canApproveListings: true,
        canRejectListings: true,
        canEditListings: true,
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
        canManageModerators: false,
        canUpdateGuidelines: false,
        canViewReports: true,
        canAssignReports: false,
      };
  }
};

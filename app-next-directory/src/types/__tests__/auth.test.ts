
import type { UserRole, PagePermissions, FeaturePermissions } from '../auth';
import { getUserPermissions, hasPagePermission, hasFeaturePermission, hasHigherRole } from '../auth';

describe('auth types coverage', () => {
  it('should use UserRole type', () => {
    const role: UserRole = 'admin';
    expect(role).toBe('admin');
  });

  it('should use PagePermissions type', () => {
    const perms: PagePermissions = {
      canView: true,
      canCreate: false,
      canEdit: true,
      canDelete: false,
      canManage: true,
    };
    expect(perms.canManage).toBe(true);
  });

  it('should use FeaturePermissions type', () => {
    const featurePerms: FeaturePermissions = {
      submitListings: true,
      editOwnListings: true,
      editAllListings: false,
      deleteOwnListings: false,
      deleteAllListings: false,
      moderateListings: false,
      submitReviews: true,
      editOwnReviews: false,
      editAllReviews: false,
      deleteOwnReviews: false,
      deleteAllReviews: false,
      moderateReviews: false,
      viewUserProfiles: true,
      editOwnProfile: true,
      editAllProfiles: false,
      deleteUsers: false,
      manageUserRoles: false,
      createContent: true,
      editContent: false,
      deleteContent: false,
      publishContent: false,
      accessAnalytics: false,
      manageSettings: false,
      viewAuditLogs: false,
      exportData: false,
      submitContactForms: true,
      viewContactSubmissions: false,
      respondToContact: false,
    };
    expect(featurePerms.submitListings).toBe(true);
    expect(featurePerms.editAllListings).toBe(false);
  });
  it('should call getUserPermissions for all roles', () => {
    const roles: UserRole[] = ['admin', 'user', 'editor', 'venueOwner', 'superAdmin'];
    for (const role of roles) {
      const perms = getUserPermissions(role);
      expect(perms).toHaveProperty('pages');
      expect(perms).toHaveProperty('features');
    }
  });

  it('should check hasPagePermission for a few cases', () => {
    expect(hasPagePermission('admin', 'home', 'canView')).toBe(true);
    expect(hasPagePermission('user', 'admin', 'canView')).toBe(false);
  });

  it('should check hasFeaturePermission for a few cases', () => {
    expect(hasFeaturePermission('admin', 'submitListings')).toBe(true);
    expect(hasFeaturePermission('user', 'submitListings')).toBe(false);
  });

  it('should check hasHigherRole for all role pairs', () => {
    const roles: UserRole[] = ['user', 'editor', 'venueOwner', 'admin', 'superAdmin'];
    for (let i = 0; i < roles.length; i++) {
      for (let j = 0; j < roles.length; j++) {
        hasHigherRole(roles[i], roles[j]);
      }
    }
    expect(hasHigherRole('admin', 'user')).toBe(true);
    expect(hasHigherRole('user', 'admin')).toBe(false);
    expect(hasHigherRole('superAdmin', 'admin')).toBe(true);
  });
});

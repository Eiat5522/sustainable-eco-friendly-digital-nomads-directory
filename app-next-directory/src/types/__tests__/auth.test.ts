import {
  ACCESS_CONTROL_MATRIX,
  type FeaturePermissions,
  getUserPermissions,
  hasFeaturePermission,
  hasHigherRole,
  hasPagePermission,
  type UserRole,
} from '../auth';

describe('auth types utility', () => {
  const roles: UserRole[] = ['user', 'editor', 'venueOwner', 'admin', 'superAdmin'];

  describe('hasPagePermission', () => {
    it('returns the correct boolean based on role and matrix', () => {
      // Test basic user permissions
      expect(hasPagePermission('user', 'home', 'canView')).toBe(true);
      expect(hasPagePermission('user', 'createListing', 'canCreate')).toBe(false);

      // Test editor permissions
      expect(hasPagePermission('editor', 'listings', 'canEdit')).toBe(true);
      expect(hasPagePermission('editor', 'admin', 'canView')).toBe(false);

      // Test admin permissions
      expect(hasPagePermission('admin', 'admin', 'canView')).toBe(true);
      expect(hasPagePermission('admin', 'admin', 'canManage')).toBe(true);
    });

    it('covers all standard matrix permutations for a specific role', () => {
      const actions = ['canView', 'canCreate', 'canEdit', 'canDelete', 'canManage'] as const;

      roles.forEach(role => {
        const pages = Object.keys(ACCESS_CONTROL_MATRIX[role].pages) as Array<
          keyof (typeof ACCESS_CONTROL_MATRIX)[UserRole]['pages']
        >;

        pages.forEach(page => {
          actions.forEach(action => {
            const expected = ACCESS_CONTROL_MATRIX[role].pages[page][action];
            expect(hasPagePermission(role, page, action)).toBe(expected);
          });
        });
      });
    });
  });

  describe('hasFeaturePermission', () => {
    it('returns the correct boolean for feature permissions', () => {
      expect(hasFeaturePermission('user', 'submitListings')).toBe(false);
      expect(hasFeaturePermission('user', 'submitReviews')).toBe(true);
      expect(hasFeaturePermission('admin', 'manageUserRoles')).toBe(true);
    });

    it('covers all feature matrix permutations', () => {
      roles.forEach(role => {
        const features = Object.keys(ACCESS_CONTROL_MATRIX[role].features) as Array<
          keyof FeaturePermissions
        >;
        features.forEach(feature => {
          const expected = ACCESS_CONTROL_MATRIX[role].features[feature];
          expect(hasFeaturePermission(role, feature)).toBe(expected);
        });
      });
    });
  });

  describe('getUserPermissions', () => {
    it('returns the complete permission object for a given role', () => {
      roles.forEach(role => {
        const expected = ACCESS_CONTROL_MATRIX[role];
        expect(getUserPermissions(role)).toEqual(expected);
      });
    });
  });

  describe('hasHigherRole', () => {
    it('correctly compares role hierarchy', () => {
      expect(hasHigherRole('superAdmin', 'admin')).toBe(true);
      expect(hasHigherRole('admin', 'admin')).toBe(true);
      expect(hasHigherRole('user', 'admin')).toBe(false);
      expect(hasHigherRole('venueOwner', 'user')).toBe(true);
      expect(hasHigherRole('editor', 'venueOwner')).toBe(false);
    });
  });
});

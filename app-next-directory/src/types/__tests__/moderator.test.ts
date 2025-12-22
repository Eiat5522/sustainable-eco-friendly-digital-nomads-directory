import type { Moderator, ModeratorPermissions, ModeratorRole } from '../moderator';
import { getRolePermissions } from '../moderator';

describe('moderator types and functions', () => {
  describe('ModeratorRole type', () => {
    it('should accept admin role', () => {
      const role: ModeratorRole = 'admin';
      expect(role).toBe('admin');
    });

    it('should accept editor role', () => {
      const role: ModeratorRole = 'editor';
      expect(role).toBe('editor');
    });

    it('should accept reviewer role', () => {
      const role: ModeratorRole = 'reviewer';
      expect(role).toBe('reviewer');
    });
  });

  describe('Moderator interface', () => {
    it('should accept valid moderator object', () => {
      const moderator: Moderator = {
        id: 'mod-123',
        email: 'moderator@example.com',
        role: 'editor',
        name: 'John Doe',
        actionsCount: {
          approved: 10,
          rejected: 5,
          flagged: 2,
        },
        lastActive: new Date('2024-01-15'),
      };
      expect(moderator.id).toBe('mod-123');
      expect(moderator.role).toBe('editor');
    });

    it('should accept moderator with assigned categories', () => {
      const moderator: Moderator = {
        id: 'mod-456',
        email: 'admin@example.com',
        role: 'admin',
        name: 'Jane Smith',
        assignedCategories: ['coworking', 'cafe'],
        actionsCount: {
          approved: 50,
          rejected: 10,
          flagged: 5,
        },
        lastActive: new Date(),
      };
      expect(moderator.assignedCategories).toHaveLength(2);
      expect(moderator.assignedCategories).toContain('coworking');
    });

    it('should accept moderator without assigned categories', () => {
      const moderator: Moderator = {
        id: 'rev-789',
        email: 'reviewer@example.com',
        role: 'reviewer',
        name: 'Bob Johnson',
        actionsCount: {
          approved: 0,
          rejected: 0,
          flagged: 3,
        },
        lastActive: new Date(),
      };
      expect(moderator.assignedCategories).toBeUndefined();
    });

    it('should track action counts correctly', () => {
      const moderator: Moderator = {
        id: 'mod-1',
        email: 'test@example.com',
        role: 'editor',
        name: 'Test Moderator',
        actionsCount: {
          approved: 100,
          rejected: 20,
          flagged: 10,
        },
        lastActive: new Date(),
      };
      expect(moderator.actionsCount.approved).toBe(100);
      expect(moderator.actionsCount.rejected).toBe(20);
      expect(moderator.actionsCount.flagged).toBe(10);
    });

    it('should handle different lastActive dates', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-06-15');

      const mod1: Moderator = {
        id: '1',
        email: 'mod1@example.com',
        role: 'editor',
        name: 'Mod 1',
        actionsCount: { approved: 0, rejected: 0, flagged: 0 },
        lastActive: date1,
      };

      const mod2: Moderator = {
        id: '2',
        email: 'mod2@example.com',
        role: 'editor',
        name: 'Mod 2',
        actionsCount: { approved: 0, rejected: 0, flagged: 0 },
        lastActive: date2,
      };

      expect(mod1.lastActive).toEqual(date1);
      expect(mod2.lastActive).toEqual(date2);
    });
  });

  describe('ModeratorPermissions interface', () => {
    it('should accept valid permissions object', () => {
      const permissions: ModeratorPermissions = {
        canApproveListings: true,
        canRejectListings: true,
        canEditListings: true,
        canManageModerators: false,
        canUpdateGuidelines: false,
        canViewReports: true,
        canAssignReports: true,
      };
      expect(permissions.canApproveListings).toBe(true);
      expect(permissions.canManageModerators).toBe(false);
    });

    it('should accept all-true permissions', () => {
      const permissions: ModeratorPermissions = {
        canApproveListings: true,
        canRejectListings: true,
        canEditListings: true,
        canManageModerators: true,
        canUpdateGuidelines: true,
        canViewReports: true,
        canAssignReports: true,
      };
      expect(Object.values(permissions).every(v => v === true)).toBe(true);
    });

    it('should accept all-false permissions', () => {
      const permissions: ModeratorPermissions = {
        canApproveListings: false,
        canRejectListings: false,
        canEditListings: false,
        canManageModerators: false,
        canUpdateGuidelines: false,
        canViewReports: false,
        canAssignReports: false,
      };
      expect(Object.values(permissions).every(v => v === false)).toBe(true);
    });
  });

  describe('getRolePermissions function', () => {
    describe('admin role permissions', () => {
      it('should return full permissions for admin', () => {
        const permissions = getRolePermissions('admin');
        expect(permissions.canApproveListings).toBe(true);
        expect(permissions.canRejectListings).toBe(true);
        expect(permissions.canEditListings).toBe(true);
        expect(permissions.canManageModerators).toBe(true);
        expect(permissions.canUpdateGuidelines).toBe(true);
        expect(permissions.canViewReports).toBe(true);
        expect(permissions.canAssignReports).toBe(true);
      });

      it('should have all permissions set to true for admin', () => {
        const permissions = getRolePermissions('admin');
        const allTrue = Object.values(permissions).every(v => v === true);
        expect(allTrue).toBe(true);
      });
    });

    describe('moderator role permissions', () => {
      it('should return correct permissions for moderator', () => {
        const permissions = getRolePermissions('moderator');
        expect(permissions.canApproveListings).toBe(true);
        expect(permissions.canRejectListings).toBe(true);
        expect(permissions.canEditListings).toBe(true);
        expect(permissions.canManageModerators).toBe(false);
        expect(permissions.canUpdateGuidelines).toBe(false);
        expect(permissions.canViewReports).toBe(true);
        expect(permissions.canAssignReports).toBe(true);
      });

      it('should not allow moderators to manage other moderators', () => {
        const permissions = getRolePermissions('moderator');
        expect(permissions.canManageModerators).toBe(false);
      });

      it('should not allow moderators to update guidelines', () => {
        const permissions = getRolePermissions('moderator');
        expect(permissions.canUpdateGuidelines).toBe(false);
      });

      it('should allow moderators to handle listings', () => {
        const permissions = getRolePermissions('moderator');
        expect(permissions.canApproveListings).toBe(true);
        expect(permissions.canRejectListings).toBe(true);
        expect(permissions.canEditListings).toBe(true);
      });
    });

    describe('reviewer role permissions', () => {
      it('should return correct permissions for reviewer', () => {
        const permissions = getRolePermissions('reviewer');
        expect(permissions.canApproveListings).toBe(false);
        expect(permissions.canRejectListings).toBe(false);
        expect(permissions.canEditListings).toBe(false);
        expect(permissions.canManageModerators).toBe(false);
        expect(permissions.canUpdateGuidelines).toBe(false);
        expect(permissions.canViewReports).toBe(true);
        expect(permissions.canAssignReports).toBe(false);
      });

      it('should only allow reviewers to view reports', () => {
        const permissions = getRolePermissions('reviewer');
        expect(permissions.canViewReports).toBe(true);
        expect(permissions.canAssignReports).toBe(false);
      });

      it('should not allow reviewers to modify listings', () => {
        const permissions = getRolePermissions('reviewer');
        expect(permissions.canApproveListings).toBe(false);
        expect(permissions.canRejectListings).toBe(false);
        expect(permissions.canEditListings).toBe(false);
      });
    });

    describe('permission comparison across roles', () => {
      it('should give admin more permissions than moderator', () => {
        const adminPerms = getRolePermissions('admin');
        const modPerms = getRolePermissions('moderator');

        expect(adminPerms.canManageModerators).toBe(true);
        expect(modPerms.canManageModerators).toBe(false);

        expect(adminPerms.canUpdateGuidelines).toBe(true);
        expect(modPerms.canUpdateGuidelines).toBe(false);
      });

      it('should give moderator more permissions than reviewer', () => {
        const modPerms = getRolePermissions('moderator');
        const revPerms = getRolePermissions('reviewer');

        expect(modPerms.canApproveListings).toBe(true);
        expect(revPerms.canApproveListings).toBe(false);

        expect(modPerms.canEditListings).toBe(true);
        expect(revPerms.canEditListings).toBe(false);
      });

      it('should ensure admin has all permissions that moderator has', () => {
        const adminPerms = getRolePermissions('admin');
        const modPerms = getRolePermissions('moderator');

        Object.entries(modPerms).forEach(([key, value]) => {
          if (value === true) {
            expect(adminPerms[key as keyof ModeratorPermissions]).toBe(true);
          }
        });
      });

      it('should ensure moderator has all permissions that reviewer has', () => {
        const modPerms = getRolePermissions('moderator');
        const revPerms = getRolePermissions('reviewer');

        Object.entries(revPerms).forEach(([key, value]) => {
          if (value === true) {
            expect(modPerms[key as keyof ModeratorPermissions]).toBe(true);
          }
        });
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should work with permission checking logic', () => {
      const moderator: Moderator = {
        id: 'mod-1',
        email: 'test@example.com',
        role: 'editor',
        name: 'Test Mod',
        actionsCount: { approved: 10, rejected: 5, flagged: 2 },
        lastActive: new Date(),
      };

      const permissions = getRolePermissions(moderator.role);

      if (permissions.canApproveListings) {
        expect(moderator.role).not.toBe('reviewer');
      }
    });

    it('should support role-based access control patterns', () => {
      const roles: ModeratorRole[] = ['admin', 'editor', 'reviewer'];
      const permissionsMap = roles.map(role => ({
        role,
        permissions: getRolePermissions(role),
      }));

      expect(permissionsMap).toHaveLength(3);
      expect(permissionsMap[0].permissions.canManageModerators).toBe(true);
      expect(permissionsMap[2].permissions.canEditListings).toBe(false);
    });

    it('should handle moderator action tracking', () => {
      const moderator: Moderator = {
        id: 'mod-1',
        email: 'active@example.com',
        role: 'moderator',
        name: 'Active Mod',
        actionsCount: { approved: 0, rejected: 0, flagged: 0 },
        lastActive: new Date(),
      };

      moderator.actionsCount.approved += 1;
      expect(moderator.actionsCount.approved).toBe(1);

      moderator.actionsCount.rejected += 2;
      expect(moderator.actionsCount.rejected).toBe(2);
    });

    it('should support filtering moderators by role', () => {
      const moderators: Moderator[] = [
        {
          id: '1',
          email: 'admin@test.com',
          role: 'admin',
          name: 'Admin',
          actionsCount: { approved: 0, rejected: 0, flagged: 0 },
          lastActive: new Date(),
        },
        {
          id: '2',
          email: 'mod@test.com',
          role: 'editor',
          name: 'Moderator',
          actionsCount: { approved: 0, rejected: 0, flagged: 0 },
          lastActive: new Date(),
        },
      ];

      const admins = moderators.filter(m => m.role === 'admin');
      const mods = moderators.filter(m => m.role === 'editor');

      expect(admins).toHaveLength(1);
      expect(mods).toHaveLength(1);
    });
  });
});

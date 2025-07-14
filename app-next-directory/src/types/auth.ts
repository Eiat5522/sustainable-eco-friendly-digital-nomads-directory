// Auth types
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as NextAuthJWT } from "next-auth/jwt";

declare module "next-auth/jwt" {
  interface JWT extends NextAuthJWT {
    id: string;
    role?: UserRole;
    refreshTokenHash?: string;
    createdAt?: number;
    email?: string;
  }
}

export type UserRole = 'admin' | 'user' | 'editor' | 'venueOwner' | 'superAdmin' | 'moderator';

// Define page access permissions
export interface PagePermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManage: boolean;
}

// Define feature permissions
export interface FeaturePermissions {
  // Listing features
  submitListings: boolean;
  editOwnListings: boolean;
  editAllListings: boolean;
  deleteOwnListings: boolean;
  deleteAllListings: boolean;
  moderateListings: boolean;

  // Review features
  submitReviews: boolean;
  editOwnReviews: boolean;
  editAllReviews: boolean;
  deleteOwnReviews: boolean;
  deleteAllReviews: boolean;
  moderateReviews: boolean;

  // User management
  viewUserProfiles: boolean;
  editOwnProfile: boolean;
  editAllProfiles: boolean;
  deleteUsers: boolean;
  manageUserRoles: boolean;

  // Content management
  createContent: boolean;
  editContent: boolean;
  deleteContent: boolean;
  publishContent: boolean;

  // System features
  accessAnalytics: boolean;
  manageSettings: boolean;
  viewAuditLogs: boolean;
  exportData: boolean;

  // Contact & communication
  submitContactForms: boolean;
  viewContactSubmissions: boolean;
  respondToContact: boolean;
}

// Complete access control matrix as per audit requirements
export const ACCESS_CONTROL_MATRIX: Record<UserRole, {
  pages: {
    home: PagePermissions;
    listings: PagePermissions;
    listingDetail: PagePermissions;
    createListing: PagePermissions;
    editListing: PagePermissions;
    manageListing: PagePermissions;
    reviews: PagePermissions;
    profile: PagePermissions;
    admin: PagePermissions;
    analytics: PagePermissions;
    settings: PagePermissions;
    contact: PagePermissions;
    about: PagePermissions;
    blog: PagePermissions;
  };
  features: FeaturePermissions;
}> = {
  admin: {
    pages: {
      home: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
      listings: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
      listingDetail: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
      createListing: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
      editListing: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
      manageListing: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
      reviews: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
      profile: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
      admin: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
      analytics: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
      settings: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
      contact: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
      about: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
      blog: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    },
    features: {
      submitListings: true,
      editOwnListings: true,
      editAllListings: true,
      deleteOwnListings: true,
      deleteAllListings: true,
      moderateListings: true,
      submitReviews: true,
      editOwnReviews: true,
      editAllReviews: true,
      deleteOwnReviews: true,
      deleteAllReviews: true,
      moderateReviews: true,
      viewUserProfiles: true,
      editOwnProfile: true,
      editAllProfiles: true,
      deleteUsers: true,
      manageUserRoles: true,
      createContent: true,
      editContent: true,
      deleteContent: true,
      publishContent: true,
      accessAnalytics: true,
      manageSettings: true,
      viewAuditLogs: true,
      exportData: true,
      submitContactForms: true,
      viewContactSubmissions: true,
      respondToContact: true,
    },
  },
  superAdmin: { // Added superAdmin definition
    pages: {
      home: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
      listings: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
      listingDetail: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
      createListing: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
      editListing: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
      manageListing: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
      reviews: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
      profile: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
      admin: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
      analytics: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
      settings: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
      contact: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
      about: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
      blog: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    },
    features: {
      submitListings: true,
      editOwnListings: true,
      editAllListings: true,
      deleteOwnListings: true,
      deleteAllListings: true,
      moderateListings: true,
      submitReviews: true,
      editOwnReviews: true,
      editAllReviews: true,
      deleteOwnReviews: true,
      deleteAllReviews: true,
      moderateReviews: true,
      viewUserProfiles: true,
      editOwnProfile: true,
      editAllProfiles: true,
      deleteUsers: true,
      manageUserRoles: true,
      createContent: true,
      editContent: true,
      deleteContent: true,
      publishContent: true,
      accessAnalytics: true,
      manageSettings: true,
      viewAuditLogs: true,
      exportData: true,
      submitContactForms: true,
      viewContactSubmissions: true,
      respondToContact: true,
    },
  },
  moderator: {
    pages: {
      home: { canView: true, canCreate: false, canEdit: false, canDelete: false, canManage: false },
      listings: { canView: true, canCreate: false, canEdit: true, canDelete: false, canManage: true },
      listingDetail: { canView: true, canCreate: false, canEdit: true, canDelete: false, canManage: false },
      createListing: { canView: false, canCreate: false, canEdit: false, canDelete: false, canManage: false },
      editListing: { canView: false, canCreate: false, canEdit: true, canDelete: false, canManage: false },
      manageListing: { canView: false, canCreate: false, canEdit: true, canDelete: false, canManage: true },
      reviews: { canView: true, canCreate: false, canEdit: true, canDelete: false, canManage: true },
      profile: { canView: true, canCreate: false, canEdit: true, canDelete: false, canManage: false },
      admin: { canView: true, canCreate: false, canEdit: false, canDelete: false, canManage: true },
      analytics: { canView: false, canCreate: false, canEdit: false, canDelete: false, canManage: false },
      settings: { canView: false, canCreate: false, canEdit: false, canDelete: false, canManage: false },
      contact: { canView: true, canCreate: false, canEdit: true, canDelete: false, canManage: false },
      about: { canView: true, canCreate: false, canEdit: false, canDelete: false, canManage: false },
      blog: { canView: true, canCreate: false, canEdit: true, canDelete: false, canManage: true },
    },
    features: {
      submitListings: false,
      editOwnListings: false,
      editAllListings: true,
      deleteOwnListings: false,
      deleteAllListings: false,
      moderateListings: true,
      submitReviews: true,
      editOwnReviews: false,
      editAllReviews: true,
      deleteOwnReviews: false,
      deleteAllReviews: false,
      moderateReviews: true,
      viewUserProfiles: true,
      editOwnProfile: true,
      editAllProfiles: false,
      deleteUsers: false,
      manageUserRoles: false,
      createContent: false,
      editContent: true,
      deleteContent: false,
      publishContent: true,
      accessAnalytics: false,
      manageSettings: false,
      viewAuditLogs: true,
      exportData: false,
      submitContactForms: false,
      viewContactSubmissions: true,
      respondToContact: true,
    },
  },
  venueOwner: {
    pages: {
      home: { canView: true, canCreate: false, canEdit: false, canDelete: false, canManage: false },
      listings: { canView: true, canCreate: true, canEdit: false, canDelete: false, canManage: false },
      listingDetail: { canView: true, canCreate: false, canEdit: false, canDelete: false, canManage: false },
      createListing: { canView: true, canCreate: true, canEdit: false, canDelete: false, canManage: false },
      editListing: { canView: true, canCreate: false, canEdit: true, canDelete: false, canManage: false },
      manageListing: { canView: true, canCreate: false, canEdit: true, canDelete: true, canManage: true },
      reviews: { canView: true, canCreate: false, canEdit: false, canDelete: false, canManage: false },
      profile: { canView: true, canCreate: false, canEdit: true, canDelete: false, canManage: false },
      admin: { canView: false, canCreate: false, canEdit: false, canDelete: false, canManage: false },
      analytics: { canView: true, canCreate: false, canEdit: false, canDelete: false, canManage: false },
      settings: { canView: false, canCreate: false, canEdit: false, canDelete: false, canManage: false },
      contact: { canView: true, canCreate: true, canEdit: false, canDelete: false, canManage: false },
      about: { canView: true, canCreate: false, canEdit: false, canDelete: false, canManage: false },
      blog: { canView: true, canCreate: false, canEdit: false, canDelete: false, canManage: false },
    },
    features: {
      submitListings: true,
      editOwnListings: true,
      editAllListings: false,
      deleteOwnListings: true,
      deleteAllListings: false,
      moderateListings: false,
      submitReviews: true,
      editOwnReviews: true,
      editAllReviews: false,
      deleteOwnReviews: true,
      deleteAllReviews: false,
      moderateReviews: false,
      viewUserProfiles: false,
      editOwnProfile: true,
      editAllProfiles: false,
      deleteUsers: false,
      manageUserRoles: false,
      createContent: false,
      editContent: false,
      deleteContent: false,
      publishContent: false,
      accessAnalytics: true, // Own listing analytics only
      manageSettings: false,
      viewAuditLogs: false,
      exportData: false,
      submitContactForms: true,
      viewContactSubmissions: false,
      respondToContact: false,
    },
  },
  user: {
    pages: {
      home: { canView: true, canCreate: false, canEdit: false, canDelete: false, canManage: false },
      listings: { canView: true, canCreate: false, canEdit: false, canDelete: false, canManage: false },
      listingDetail: { canView: true, canCreate: false, canEdit: false, canDelete: false, canManage: false },
      createListing: { canView: true, canCreate: false, canEdit: false, canDelete: false, canManage: false },
      editListing: { canView: false, canCreate: false, canEdit: false, canDelete: false, canManage: false },
      manageListing: { canView: false, canCreate: false, canEdit: false, canDelete: false, canManage: false },
      reviews: { canView: true, canCreate: true, canEdit: false, canDelete: false, canManage: false },
      profile: { canView: true, canCreate: false, canEdit: true, canDelete: false, canManage: false },
      admin: { canView: false, canCreate: false, canEdit: false, canDelete: false, canManage: false },
      analytics: { canView: false, canCreate: false, canEdit: false, canDelete: false, canManage: false },
      settings: { canView: false, canCreate: false, canEdit: false, canDelete: false, canManage: false },
      contact: { canView: true, canCreate: true, canEdit: false, canDelete: false, canManage: false },
      about: { canView: true, canCreate: false, canEdit: false, canDelete: false, canManage: false },
      blog: { canView: true, canCreate: false, canEdit: false, canDelete: false, canManage: false },
    },
    features: {
      submitListings: false,
      editOwnListings: false,
      editAllListings: false,
      deleteOwnListings: false,
      deleteAllListings: false,
      moderateListings: false,
      submitReviews: true,
      editOwnReviews: true,
      editAllReviews: false,
      deleteOwnReviews: true,
      deleteAllReviews: false,
      moderateReviews: false,
      viewUserProfiles: false,
      editOwnProfile: true,
      editAllProfiles: false,
      deleteUsers: false,
      manageUserRoles: false,
      createContent: false,
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
    },
  },
  editor: {
    pages: {
      home: { canView: true, canCreate: false, canEdit: true, canDelete: false, canManage: false },
      listings: { canView: true, canCreate: true, canEdit: true, canDelete: false, canManage: true },
      listingDetail: { canView: true, canCreate: false, canEdit: true, canDelete: false, canManage: false },
      createListing: { canView: true, canCreate: true, canEdit: false, canDelete: false, canManage: false },
      editListing: { canView: true, canCreate: false, canEdit: true, canDelete: false, canManage: false },
      manageListing: { canView: true, canCreate: false, canEdit: true, canDelete: false, canManage: true },
      reviews: { canView: true, canCreate: true, canEdit: true, canDelete: false, canManage: true },
      profile: { canView: true, canCreate: false, canEdit: true, canDelete: false, canManage: false },
      admin: { canView: false, canCreate: false, canEdit: false, canDelete: false, canManage: false },
      analytics: { canView: true, canCreate: false, canEdit: false, canDelete: false, canManage: false },
      settings: { canView: false, canCreate: false, canEdit: false, canDelete: false, canManage: false },
      contact: { canView: true, canCreate: true, canEdit: true, canDelete: false, canManage: false },
      about: { canView: true, canCreate: true, canEdit: true, canDelete: false, canManage: false },
      blog: { canView: true, canCreate: true, canEdit: true, canDelete: false, canManage: true },
    },
    features: {
      submitListings: true,
      editOwnListings: true,
      editAllListings: true,
      deleteOwnListings: false,
      deleteAllListings: false,
      moderateListings: true,
      submitReviews: true,
      editOwnReviews: true,
      editAllReviews: true,
      deleteOwnReviews: false,
      deleteAllReviews: false,
      moderateReviews: true,
      viewUserProfiles: true,
      editOwnProfile: true,
      editAllProfiles: false,
      deleteUsers: false,
      manageUserRoles: false,
      createContent: true,
      editContent: true,
      deleteContent: false,
      publishContent: true,
      accessAnalytics: true,
      manageSettings: false,
      viewAuditLogs: false,
      exportData: true,
      submitContactForms: true,
      viewContactSubmissions: true,
      respondToContact: true,
    },
  },
};

// Utility functions for permission checking
export function getUserPermissions(role: UserRole): { pages: any; features: FeaturePermissions } {
  return ACCESS_CONTROL_MATRIX[role];
}

export function hasPagePermission(
  role: UserRole,
  page: keyof typeof ACCESS_CONTROL_MATRIX[UserRole]['pages'],
  action: keyof PagePermissions
): boolean {
  return ACCESS_CONTROL_MATRIX[role].pages[page][action];
}

export function hasFeaturePermission(
  role: UserRole,
  feature: keyof FeaturePermissions
): boolean {
  return ACCESS_CONTROL_MATRIX[role].features[feature];
}

// Role hierarchy for administrative purposes
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 0,
  editor: 1,
  venueOwner: 2,
  moderator: 3,
  admin: 4,
  superAdmin: 5,
};

export function hasHigherRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// Extend the built-in session types


// Define auth form types
export interface SignInFormValues {
  email: string;
  password: string;
}

export interface SignUpFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Define schema for user profile
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
  bio?: string;
  role: UserRole;
  createdAt?: string;
}

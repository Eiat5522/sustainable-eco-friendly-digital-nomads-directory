/**
 * Admin Settings Types
 * Defines the structure of admin settings data
 */

export interface AdminSettings {
  _id?: string;
  _type: 'adminSettings';
  _createdAt?: string;
  _updatedAt?: string;

  // General Settings
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean;
  allowRegistrations: boolean;

  // Email Settings
  emailNotifications: boolean;
  adminEmail: string;

  // Moderation Settings
  autoModeration: boolean;
  moderationThreshold: number;

  // Content Settings
  postsPerPage: number;
  enableComments: boolean;

  // Security Settings
  requireEmailVerification: boolean;
  sessionTimeout: number; // in minutes

  // Backup Settings
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  lastBackupDate?: string;
}

export interface AdminSettingsResponse {
  settings: AdminSettings;
}

export interface AdminSettingsSaveRequest {
  settings: Partial<AdminSettings>;
}

export interface AdminSettingsSaveResponse {
  success: boolean;
  settings: AdminSettings;
  message: string;
}

export interface AdminSettingsError {
  error: string;
  message?: string;
}

/**
 * Default admin settings
 */
export const DEFAULT_ADMIN_SETTINGS: Omit<AdminSettings, '_id' | '_createdAt' | '_updatedAt'> = {
  _type: 'adminSettings',
  siteName: 'Sustainable Digital Nomads Directory',
  siteDescription: 'A community for eco-conscious digital nomads',
  maintenanceMode: false,
  allowRegistrations: true,
  emailNotifications: true,
  adminEmail: 'admin@example.com',
  autoModeration: false,
  moderationThreshold: 3,
  postsPerPage: 20,
  enableComments: true,
  requireEmailVerification: true,
  sessionTimeout: 60,
  autoBackup: false,
  backupFrequency: 'weekly',
};

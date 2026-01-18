import type { AdminSettings } from '@/types/admin-settings';

export type SettingsFormData = Omit<AdminSettings, '_id' | '_type' | '_createdAt' | '_updatedAt'>;

'use client';

import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  AdminSettingsError,
  AdminSettingsResponse,
  AdminSettingsSaveResponse,
} from '@/types/admin-settings';
import type { SettingsFormData } from './types';

type SettingsFormProps = {
  initialSettings?: SettingsFormData;
};

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [settings, setSettings] = useState<SettingsFormData | null>(initialSettings ?? null);
  const [loading, setLoading] = useState(!initialSettings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [backupStatus, setBackupStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [backupRunning, setBackupRunning] = useState(false);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/settings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = (await response.json()) as AdminSettingsError;
        throw new Error(errorData.error || 'Failed to fetch settings');
      }

      const data = (await response.json()) as AdminSettingsResponse;

      // Extract only the form fields from settings
      const {
        _id: ignoredId,
        _type: ignoredType,
        _createdAt: ignoredCreatedAt,
        _updatedAt: ignoredUpdatedAt,
        ...formData
      } = data.settings;
      setSettings(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch settings on component mount
  useEffect(() => {
    if (!initialSettings) {
      fetchSettings();
    }
  }, [fetchSettings, initialSettings]);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      if (backupTimeoutRef.current) {
        clearTimeout(backupTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!settings) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as AdminSettingsError;
        throw new Error(errorData.error || 'Failed to save settings');
      }

      const data = (await response.json()) as AdminSettingsSaveResponse;

      if (data.success) {
        setSuccessMessage(data.message || 'Settings saved successfully');

        // Update settings with saved data
        const {
          _id: ignoredId,
          _type: ignoredType,
          _createdAt: ignoredCreatedAt,
          _updatedAt: ignoredUpdatedAt,
          ...formData
        } = data.settings;
        setSettings(formData);

        if (successTimeoutRef.current) {
          clearTimeout(successTimeoutRef.current);
        }
        successTimeoutRef.current = setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    setSettings(prev => {
      if (!prev) return prev;

      let newValue: string | number | boolean = value;

      if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
        newValue = e.target.checked;
      } else if (type === 'number') {
        newValue = parseInt(value, 10);
      }

      return {
        ...prev,
        [name]: newValue,
      };
    });
  };

  const handleBackup = async () => {
    if (!settings) {
      return;
    }

    try {
      setBackupRunning(true);
      setBackupStatus(null);

      const response = await fetch('/api/admin/settings/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        const reason = data?.error ?? 'Failed to run backup';
        throw new Error(reason);
      }

      if (typeof data.lastBackupDate === 'string') {
        setSettings(prev => {
          if (!prev) return prev;
          return { ...prev, lastBackupDate: data.lastBackupDate };
        });
      }

      setBackupStatus({
        type: 'success',
        message: data.message ?? 'Backup completed successfully',
      });
      if (backupTimeoutRef.current) {
        clearTimeout(backupTimeoutRef.current);
      }
      backupTimeoutRef.current = setTimeout(() => setBackupStatus(null), 4000);
    } catch (err) {
      setBackupStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to run backup',
      });
      if (backupTimeoutRef.current) {
        clearTimeout(backupTimeoutRef.current);
      }
      backupTimeoutRef.current = setTimeout(() => setBackupStatus(null), 5000);
    } finally {
      setBackupRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !settings) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
          <button
            type="button"
            onClick={fetchSettings}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!settings) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="p-6" data-testid="settings-form">
      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-green-800" data-testid="success-message">
            {successMessage}
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800" data-testid="error-message">
            {error}
          </p>
        </div>
      )}

      {/* General Settings */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">General Settings</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="siteName" className="block text-sm font-medium text-gray-700 mb-1">
              Site Name
            </label>
            <input
              type="text"
              id="siteName"
              name="siteName"
              value={settings.siteName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="siteDescription"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Site Description
            </label>
            <textarea
              id="siteDescription"
              name="siteDescription"
              value={settings.siteDescription}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="maintenanceMode"
              name="maintenanceMode"
              checked={settings.maintenanceMode}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="maintenanceMode" className="ml-2 block text-sm text-gray-700">
              Maintenance Mode
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="allowRegistrations"
              name="allowRegistrations"
              checked={settings.allowRegistrations}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="allowRegistrations" className="ml-2 block text-sm text-gray-700">
              Allow New Registrations
            </label>
          </div>
        </div>
      </section>

      {/* Email Settings */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Email Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="emailNotifications"
              name="emailNotifications"
              checked={settings.emailNotifications}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-700">
              Enable Email Notifications
            </label>
          </div>

          <div>
            <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Admin Email
            </label>
            <input
              type="email"
              id="adminEmail"
              name="adminEmail"
              value={settings.adminEmail}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>
      </section>

      {/* Moderation Settings */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Moderation Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoModeration"
              name="autoModeration"
              checked={settings.autoModeration}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="autoModeration" className="ml-2 block text-sm text-gray-700">
              Enable Auto-Moderation
            </label>
          </div>

          <div>
            <label
              htmlFor="moderationThreshold"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Moderation Threshold
            </label>
            <input
              type="number"
              id="moderationThreshold"
              name="moderationThreshold"
              value={settings.moderationThreshold}
              onChange={handleInputChange}
              min="1"
              max="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Number of reports before auto-moderation action
            </p>
          </div>
        </div>
      </section>

      {/* Content Settings */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Content Settings</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="postsPerPage" className="block text-sm font-medium text-gray-700 mb-1">
              Posts Per Page
            </label>
            <input
              type="number"
              id="postsPerPage"
              name="postsPerPage"
              value={settings.postsPerPage}
              onChange={handleInputChange}
              min="10"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="enableComments"
              name="enableComments"
              checked={settings.enableComments}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="enableComments" className="ml-2 block text-sm text-gray-700">
              Enable Comments
            </label>
          </div>
        </div>
      </section>

      {/* Security Settings */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Security Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="requireEmailVerification"
              name="requireEmailVerification"
              checked={settings.requireEmailVerification}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="requireEmailVerification" className="ml-2 block text-sm text-gray-700">
              Require Email Verification
            </label>
          </div>

          <div>
            <label
              htmlFor="sessionTimeout"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Session Timeout (minutes)
            </label>
            <input
              type="number"
              id="sessionTimeout"
              name="sessionTimeout"
              value={settings.sessionTimeout}
              onChange={handleInputChange}
              min="15"
              max="1440"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>
      </section>

      {/* Backup Settings */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Backup Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoBackup"
              name="autoBackup"
              checked={settings.autoBackup}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="autoBackup" className="ml-2 block text-sm text-gray-700">
              Enable Auto-Backup
            </label>
          </div>

          <div>
            <label
              htmlFor="backupFrequency"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Backup Frequency
            </label>
            <select
              id="backupFrequency"
              name="backupFrequency"
              value={settings.backupFrequency}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {settings.lastBackupDate && (
            <div className="text-sm text-gray-600">
              Last backup: {new Date(settings.lastBackupDate).toLocaleString()}
            </div>
          )}

          {backupStatus && (
            <div
              className={`text-sm ${backupStatus.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}
              data-testid="backup-status-message"
            >
              {backupStatus.message}
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={handleBackup}
              disabled={backupRunning}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="run-backup-button"
            >
              {backupRunning ? 'Running Backup...' : 'Run Backup'}
            </button>
          </div>
        </div>
      </section>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={fetchSettings}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="save-settings-button"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </form>
  );
}

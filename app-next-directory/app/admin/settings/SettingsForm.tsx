'use client';

import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { NeoButton } from '@/components/ui/neo-button';
import { NeoInput } from '@/components/ui/neo-input';
import type {
  AdminSettingsError,
  AdminSettingsResponse,
  AdminSettingsSaveResponse,
} from '@/types/admin-settings';
import type { SettingsFormData } from './types';

type SettingsFormProps = {
  initialSettings?: SettingsFormData;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border-4 border-neo-border bg-white/95 p-5 shadow-[8px_8px_0px_0px_var(--color-neo-shadow)]">
      <h2 className="heading-sm text-neo-text-primary">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function ToggleField({
  id,
  name,
  checked,
  label,
  onChange,
}: {
  id: string;
  name: string;
  checked: boolean;
  label: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-neo-border bg-neo-surface/60 px-4 py-3"
    >
      <input
        type="checkbox"
        id={id}
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-neo-border text-neo-primary focus:ring-neo-primary"
      />
      <span className="text-sm font-medium text-neo-text-primary">{label}</span>
    </label>
  );
}

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
      <div className="rounded-2xl border-4 border-neo-border bg-neo-surface/70 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-current border-r-transparent" />
            <p className="mt-4 text-neo-text-secondary">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !settings) {
    return (
      <div className="rounded-2xl border-4 border-rose-200 bg-rose-50 p-6">
        <p className="text-rose-800">{error}</p>
        <button
          type="button"
          onClick={fetchSettings}
          className="mt-2 text-sm font-semibold text-rose-700 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!settings) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="settings-form">
      {successMessage && (
        <div className="rounded-2xl border-4 border-emerald-200 bg-emerald-50 p-4">
          <p className="text-emerald-800" data-testid="success-message">
            {successMessage}
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border-4 border-rose-200 bg-rose-50 p-4">
          <p className="text-rose-800" data-testid="error-message">
            {error}
          </p>
        </div>
      )}

      <Section title="General Settings">
        <div>
          <label htmlFor="siteName" className="mb-1 block text-sm font-semibold text-neo-text-primary">
            Site Name
          </label>
          <NeoInput
            type="text"
            id="siteName"
            name="siteName"
            value={settings.siteName}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <label htmlFor="siteDescription" className="mb-1 block text-sm font-semibold text-neo-text-primary">
            Site Description
          </label>
          <textarea
            id="siteDescription"
            name="siteDescription"
            value={settings.siteDescription}
            onChange={handleInputChange}
            rows={3}
            className="w-full rounded-lg border-2 border-neo-border bg-neo-surface px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary"
            required
          />
        </div>

        <ToggleField
          id="maintenanceMode"
          name="maintenanceMode"
          checked={settings.maintenanceMode}
          onChange={handleInputChange}
          label="Maintenance Mode"
        />

        <ToggleField
          id="allowRegistrations"
          name="allowRegistrations"
          checked={settings.allowRegistrations}
          onChange={handleInputChange}
          label="Allow New Registrations"
        />
      </Section>

      <Section title="Email Settings">
        <ToggleField
          id="emailNotifications"
          name="emailNotifications"
          checked={settings.emailNotifications}
          onChange={handleInputChange}
          label="Enable Email Notifications"
        />

        <div>
          <label htmlFor="adminEmail" className="mb-1 block text-sm font-semibold text-neo-text-primary">
            Admin Email
          </label>
          <NeoInput
            type="email"
            id="adminEmail"
            name="adminEmail"
            value={settings.adminEmail}
            onChange={handleInputChange}
            required
          />
        </div>
      </Section>

      <Section title="Moderation Settings">
        <ToggleField
          id="autoModeration"
          name="autoModeration"
          checked={settings.autoModeration}
          onChange={handleInputChange}
          label="Enable Auto-Moderation"
        />

        <div>
          <label
            htmlFor="moderationThreshold"
            className="mb-1 block text-sm font-semibold text-neo-text-primary"
          >
            Moderation Threshold
          </label>
          <NeoInput
            type="number"
            id="moderationThreshold"
            name="moderationThreshold"
            value={settings.moderationThreshold}
            onChange={handleInputChange}
            min="1"
            max="10"
            required
          />
          <p className="mt-1 text-xs text-neo-text-secondary">
            Number of reports before auto-moderation action
          </p>
        </div>
      </Section>

      <Section title="Content Settings">
        <div>
          <label htmlFor="postsPerPage" className="mb-1 block text-sm font-semibold text-neo-text-primary">
            Posts Per Page
          </label>
          <NeoInput
            type="number"
            id="postsPerPage"
            name="postsPerPage"
            value={settings.postsPerPage}
            onChange={handleInputChange}
            min="10"
            max="100"
            required
          />
        </div>

        <ToggleField
          id="enableComments"
          name="enableComments"
          checked={settings.enableComments}
          onChange={handleInputChange}
          label="Enable Comments"
        />
      </Section>

      <Section title="Security Settings">
        <ToggleField
          id="requireEmailVerification"
          name="requireEmailVerification"
          checked={settings.requireEmailVerification}
          onChange={handleInputChange}
          label="Require Email Verification"
        />

        <div>
          <label htmlFor="sessionTimeout" className="mb-1 block text-sm font-semibold text-neo-text-primary">
            Session Timeout (minutes)
          </label>
          <NeoInput
            type="number"
            id="sessionTimeout"
            name="sessionTimeout"
            value={settings.sessionTimeout}
            onChange={handleInputChange}
            min="15"
            max="1440"
            required
          />
        </div>
      </Section>

      <Section title="Backup Settings">
        <ToggleField
          id="autoBackup"
          name="autoBackup"
          checked={settings.autoBackup}
          onChange={handleInputChange}
          label="Enable Auto-Backup"
        />

        <div>
          <label htmlFor="backupFrequency" className="mb-1 block text-sm font-semibold text-neo-text-primary">
            Backup Frequency
          </label>
          <select
            id="backupFrequency"
            name="backupFrequency"
            value={settings.backupFrequency}
            onChange={handleInputChange}
            className="h-12 w-full rounded-lg border-2 border-neo-border bg-neo-surface px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {settings.lastBackupDate && (
          <div className="text-sm text-neo-text-secondary">
            Last backup: {new Date(settings.lastBackupDate).toLocaleString()}
          </div>
        )}

        {backupStatus && (
          <div
            className={`text-sm font-medium ${
              backupStatus.type === 'success' ? 'text-emerald-700' : 'text-rose-700'
            }`}
            data-testid="backup-status-message"
          >
            {backupStatus.message}
          </div>
        )}

        <NeoButton
          type="button"
          onClick={handleBackup}
          disabled={backupRunning}
          variant="success"
          size="sm"
          data-testid="run-backup-button"
        >
          {backupRunning ? 'Running Backup...' : 'Run Backup'}
        </NeoButton>
      </Section>

      <div className="flex items-center justify-end gap-3 border-t-4 border-neo-border/40 pt-4">
        <NeoButton type="button" onClick={fetchSettings} disabled={saving} variant="outline" size="sm">
          Reset
        </NeoButton>
        <NeoButton type="submit" disabled={saving} size="sm" data-testid="save-settings-button">
          {saving ? 'Saving...' : 'Save Settings'}
        </NeoButton>
      </div>
    </form>
  );
}

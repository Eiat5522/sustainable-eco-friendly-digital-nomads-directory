import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { SettingsForm } from '../SettingsForm';

const mockSettings = {
  siteName: 'Test Site',
  siteDescription: 'Test Description',
  maintenanceMode: false,
  allowRegistrations: true,
  emailNotifications: true,
  adminEmail: 'admin@test.com',
  autoModeration: false,
  moderationThreshold: 5,
  postsPerPage: 20,
  enableComments: true,
  requireEmailVerification: false,
  sessionTimeout: 60,
  autoBackup: true,
  backupFrequency: 'daily' as const,
  lastBackupDate: '2024-01-15T10:00:00.000Z',
};

describe('SettingsForm', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should display loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<SettingsForm />);

    expect(screen.getByText('Loading settings...')).toBeInTheDocument();
  });

  it('should fetch and display settings', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ settings: { ...mockSettings, _id: '1', _type: 'settings' } }),
    });

    render(<SettingsForm />);

    await waitFor(() => {
      expect(screen.getByTestId('settings-form')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('Test Site')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
    expect(screen.getByDisplayValue('admin@test.com')).toBeInTheDocument();
  });

  it('should display error state when fetch fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to load' }),
    });

    render(<SettingsForm />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
    });

    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('should retry fetching settings when clicking try again', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to load' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ settings: { ...mockSettings, _id: '1', _type: 'settings' } }),
      });

    render(<SettingsForm />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Try again'));

    await waitFor(() => {
      expect(screen.getByTestId('settings-form')).toBeInTheDocument();
    });
  });

  it('should handle text input changes', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ settings: { ...mockSettings, _id: '1', _type: 'settings' } }),
    });

    const user = userEvent.setup();
    render(<SettingsForm />);

    await waitFor(() => {
      expect(screen.getByTestId('settings-form')).toBeInTheDocument();
    });

    const siteNameInput = screen.getByLabelText('Site Name');
    await user.clear(siteNameInput);
    await user.type(siteNameInput, 'New Site Name');

    expect(siteNameInput).toHaveValue('New Site Name');
  });

  it('should handle checkbox changes', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ settings: { ...mockSettings, _id: '1', _type: 'settings' } }),
    });

    const user = userEvent.setup();
    render(<SettingsForm />);

    await waitFor(() => {
      expect(screen.getByTestId('settings-form')).toBeInTheDocument();
    });

    const maintenanceModeCheckbox = screen.getByLabelText('Maintenance Mode');
    expect(maintenanceModeCheckbox).not.toBeChecked();

    await user.click(maintenanceModeCheckbox);
    expect(maintenanceModeCheckbox).toBeChecked();
  });

  it('should handle number input changes', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ settings: { ...mockSettings, _id: '1', _type: 'settings' } }),
    });

    const user = userEvent.setup();
    render(<SettingsForm />);

    await waitFor(() => {
      expect(screen.getByTestId('settings-form')).toBeInTheDocument();
    });

    const moderationThresholdInput = screen.getByLabelText('Moderation Threshold');
    await user.clear(moderationThresholdInput);
    await user.type(moderationThresholdInput, '8');

    expect(moderationThresholdInput).toHaveValue(8);
  });

  it('should handle select changes', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ settings: { ...mockSettings, _id: '1', _type: 'settings' } }),
    });

    const user = userEvent.setup();
    render(<SettingsForm />);

    await waitFor(() => {
      expect(screen.getByTestId('settings-form')).toBeInTheDocument();
    });

    const backupFrequencySelect = screen.getByLabelText('Backup Frequency');
    await user.selectOptions(backupFrequencySelect, 'weekly');

    expect(backupFrequencySelect).toHaveValue('weekly');
  });

  it('should submit settings successfully', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ settings: { ...mockSettings, _id: '1', _type: 'settings' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Settings saved successfully',
          settings: { ...mockSettings, _id: '1', _type: 'settings' },
        }),
      });

    const user = userEvent.setup();
    render(<SettingsForm />);

    await waitFor(() => {
      expect(screen.getByTestId('settings-form')).toBeInTheDocument();
    });

    const saveButton = screen.getByTestId('save-settings-button');
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toHaveTextContent(
        'Settings saved successfully'
      );
    });
  });

  it('should display error when save fails', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ settings: { ...mockSettings, _id: '1', _type: 'settings' } }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Save failed' }),
      });

    const user = userEvent.setup();
    render(<SettingsForm />);

    await waitFor(() => {
      expect(screen.getByTestId('settings-form')).toBeInTheDocument();
    });

    const saveButton = screen.getByTestId('save-settings-button');
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Save failed');
    });
  });

  it('should reset settings when clicking reset button', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ settings: { ...mockSettings, _id: '1', _type: 'settings' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ settings: { ...mockSettings, _id: '1', _type: 'settings' } }),
      });

    const user = userEvent.setup();
    render(<SettingsForm />);

    await waitFor(() => {
      expect(screen.getByTestId('settings-form')).toBeInTheDocument();
    });

    const siteNameInput = screen.getByLabelText('Site Name') as HTMLInputElement;
    expect(siteNameInput.value).toBe('Test Site');

    await user.clear(siteNameInput);
    await user.type(siteNameInput, 'Changed Name');
    expect(siteNameInput.value).toBe('Changed Name');

    const resetButton = screen.getByText('Reset');
    await user.click(resetButton);

    await waitFor(() => {
      const updatedInput = screen.getByLabelText('Site Name') as HTMLInputElement;
      expect(updatedInput.value).toBe('Test Site');
    });
  });

  it('should run backup successfully', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ settings: { ...mockSettings, _id: '1', _type: 'settings' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Backup completed successfully',
          lastBackupDate: '2024-01-16T10:00:00.000Z',
        }),
      });

    const user = userEvent.setup();
    render(<SettingsForm />);

    await waitFor(() => {
      expect(screen.getByTestId('settings-form')).toBeInTheDocument();
    });

    const backupButton = screen.getByTestId('run-backup-button');
    await user.click(backupButton);

    await waitFor(() => {
      expect(screen.getByTestId('backup-status-message')).toHaveTextContent(
        'Backup completed successfully'
      );
    });
  });

  it('should display error when backup fails', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ settings: { ...mockSettings, _id: '1', _type: 'settings' } }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Backup failed' }),
      });

    const user = userEvent.setup();
    render(<SettingsForm />);

    await waitFor(() => {
      expect(screen.getByTestId('settings-form')).toBeInTheDocument();
    });

    const backupButton = screen.getByTestId('run-backup-button');
    await user.click(backupButton);

    await waitFor(() => {
      expect(screen.getByTestId('backup-status-message')).toHaveTextContent('Backup failed');
    });
  });

  it('should disable save button while saving', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ settings: { ...mockSettings, _id: '1', _type: 'settings' } }),
      })
      .mockImplementation(() => new Promise(() => {}));

    const user = userEvent.setup();
    render(<SettingsForm />);

    await waitFor(() => {
      expect(screen.getByTestId('settings-form')).toBeInTheDocument();
    });

    const saveButton = screen.getByTestId('save-settings-button');
    await user.click(saveButton);

    expect(saveButton).toBeDisabled();
    expect(saveButton).toHaveTextContent('Saving...');
  });

  it('should disable backup button while backup is running', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ settings: { ...mockSettings, _id: '1', _type: 'settings' } }),
      })
      .mockImplementation(() => new Promise(() => {}));

    const user = userEvent.setup();
    render(<SettingsForm />);

    await waitFor(() => {
      expect(screen.getByTestId('settings-form')).toBeInTheDocument();
    });

    const backupButton = screen.getByTestId('run-backup-button');
    await user.click(backupButton);

    expect(backupButton).toBeDisabled();
    expect(backupButton).toHaveTextContent('Running Backup...');
  });

  it('should display last backup date when available', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ settings: { ...mockSettings, _id: '1', _type: 'settings' } }),
    });

    render(<SettingsForm />);

    await waitFor(() => {
      expect(screen.getByText(/Last backup:/)).toBeInTheDocument();
    });
  });

  it('should auto-clear success message after 3 seconds', async () => {
    jest.useFakeTimers();

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ settings: { ...mockSettings, _id: '1', _type: 'settings' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Settings saved successfully',
          settings: { ...mockSettings, _id: '1', _type: 'settings' },
        }),
      });

    const user = userEvent.setup({ delay: null });
    render(<SettingsForm />);

    await waitFor(() => {
      expect(screen.getByTestId('settings-form')).toBeInTheDocument();
    });

    const saveButton = screen.getByTestId('save-settings-button');
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
    });

    // Use act to wrap the timer advance
    await React.act(async () => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(screen.queryByTestId('success-message')).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it('should handle textarea input changes', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ settings: { ...mockSettings, _id: '1', _type: 'settings' } }),
    });

    const user = userEvent.setup();
    render(<SettingsForm />);

    await waitFor(() => {
      expect(screen.getByTestId('settings-form')).toBeInTheDocument();
    });

    const descriptionTextarea = screen.getByLabelText('Site Description');
    await user.clear(descriptionTextarea);
    await user.type(descriptionTextarea, 'New description');

    expect(descriptionTextarea).toHaveValue('New description');
  });

  it('should return early from submit if settings is null', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed' }),
    });

    render(<SettingsForm />);

    await waitFor(() => {
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });

    // Form should not be rendered, so submit won't be called
    expect(screen.queryByTestId('settings-form')).not.toBeInTheDocument();
  });

  it('should return early from backup if settings is null', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed' }),
    });

    render(<SettingsForm />);

    await waitFor(() => {
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('run-backup-button')).not.toBeInTheDocument();
  });
});

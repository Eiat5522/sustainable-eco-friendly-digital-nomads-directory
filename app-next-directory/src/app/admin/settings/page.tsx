'use client';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
    Bell,
    Check,
    Database,
    Globe,
    Mail,
    Save,
    Shield
} from 'lucide-react';
import { useState } from 'react';

interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    contactEmail: string;
    supportEmail: string;
    maintenanceMode: boolean;
    allowRegistration: boolean;
    requireEmailVerification: boolean;
  };
  moderation: {
    autoModeration: boolean;
    contentReviewRequired: boolean;
    minimumSustainabilityScore: number;
    flagThreshold: number;
    bannedWords: string[];
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
    enabled: boolean;
  };
  analytics: {
    googleAnalyticsId: string;
    trackingEnabled: boolean;
    cookieConsent: boolean;
    dataRetentionDays: number;
  };
  api: {
    rateLimit: number;
    cacheTTL: number;
    enableCors: boolean;
    allowedOrigins: string[];
  };
  backup: {
    automated: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    retentionDays: number;
    lastBackup?: string;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      siteName: 'Sustainable Eco-Friendly Digital Nomads Directory',
      siteDescription: 'Find and share sustainable accommodations and co-working spaces for digital nomads',
      contactEmail: 'contact@eco-nomads.com',
      supportEmail: 'support@eco-nomads.com',
      maintenanceMode: false,
      allowRegistration: true,
      requireEmailVerification: true,
    },
    moderation: {
      autoModeration: true,
      contentReviewRequired: true,
      minimumSustainabilityScore: 70,
      flagThreshold: 3,
      bannedWords: ['spam', 'fake', 'scam'],
    },
    email: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      fromEmail: 'noreply@eco-nomads.com',
      fromName: 'Eco Nomads Directory',
      enabled: false,
    },
    analytics: {
      googleAnalyticsId: '',
      trackingEnabled: false,
      cookieConsent: true,
      dataRetentionDays: 365,
    },
    api: {
      rateLimit: 100,
      cacheTTL: 300,
      enableCors: true,
      allowedOrigins: ['https://eco-nomads.com'],
    },
    backup: {
      automated: true,
      frequency: 'daily',
      retentionDays: 30,
      lastBackup: '2024-12-20T02:00:00Z',
    },
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      // TODO: Implement actual settings save API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }  };
  const handleRunBackup = async () => {
    try {
      setLoading(true);
      // TODO: Implement backup functionality
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate backup
      setSettings((prev: SystemSettings): SystemSettings => ({
        ...prev,
        backup: {
          ...prev.backup,
          lastBackup: new Date().toISOString(),
        },
      }));
    } catch (error) {
      console.error('Error running backup:', error);
    } finally {
      setLoading(false);
    }
  };  const updateGeneralSettings = (field: string, value: string | boolean | number) => {
    setSettings((prev: SystemSettings): SystemSettings => ({
      ...prev,
      general: {
        ...prev.general,
        [field]: value,
      },
    }));
  };

  const updateModerationSettings = (field: string, value: string | boolean | number | string[]) => {
    setSettings((prev: SystemSettings): SystemSettings => ({
      ...prev,
      moderation: {
        ...prev.moderation,
        [field]: value,
      },
    }));
  };

  const updateEmailSettings = (field: string, value: string | boolean | number) => {
    setSettings((prev: SystemSettings): SystemSettings => ({
      ...prev,
      email: {
        ...prev.email,
        [field]: value,
      },
    }));
  };
  const updateAnalyticsSettings = (field: string, value: string | boolean | number) => {
    setSettings((prev: SystemSettings): SystemSettings => ({
      ...prev,
      analytics: {
        ...prev.analytics,
        [field]: value,
      },
    }));
  };
  const updateApiSettings = (field: string, value: string | boolean | number | string[]) => {
    setSettings((prev: SystemSettings): SystemSettings => ({
      ...prev,
      api: {
        ...prev.api,
        [field]: value,
      },
    }));
  };
  const updateBackupSettings = (field: string, value: string | boolean | number) => {
    setSettings((prev: SystemSettings): SystemSettings => ({
      ...prev,
      backup: {
        ...prev.backup,
        [field]: value,
      },
    }));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-2">Configure system settings, security, and integrations</p>
        </div>
        <div className="flex gap-2">
          {saveSuccess && (
            <div className="flex items-center gap-2 text-green-600">
              <Check className="h-4 w-4" />
              Settings saved successfully
            </div>
          )}
          <Button onClick={handleSaveSettings} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>      {settings.general.maintenanceMode && (
        <Alert
          type="warning"
          title="Maintenance Mode Active"
          message="The site is currently in maintenance mode. Only administrators can access the system."
        />
      )}

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Basic site configuration and user registration settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>                  <Input
                    id="siteName"
                    value={settings.general.siteName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateGeneralSettings('siteName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={settings.general.contactEmail}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateGeneralSettings('contactEmail', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>                <Textarea
                  id="siteDescription"
                  value={settings.general.siteDescription}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateGeneralSettings('siteDescription', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                    <p className="text-sm text-gray-600">Temporarily disable public access</p>
                  </div>                  <Switch
                    id="maintenanceMode"
                    checked={settings.general.maintenanceMode}
                    onCheckedChange={(checked: boolean) => updateGeneralSettings('maintenanceMode', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allowRegistration">Allow Registration</Label>
                    <p className="text-sm text-gray-600">Allow new users to register</p>
                  </div>
                  <Switch
                    id="allowRegistration"
                    checked={settings.general.allowRegistration}
                    onCheckedChange={(checked: boolean) => updateGeneralSettings('allowRegistration', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="requireEmailVerification">Email Verification</Label>
                    <p className="text-sm text-gray-600">Require email verification for new accounts</p>
                  </div>
                  <Switch
                    id="requireEmailVerification"
                    checked={settings.general.requireEmailVerification}
                    onCheckedChange={(checked: boolean) => updateGeneralSettings('requireEmailVerification', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Content Moderation
              </CardTitle>
              <CardDescription>
                Configure automatic moderation and content quality settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoModeration">Auto Moderation</Label>
                    <p className="text-sm text-gray-600">Automatically moderate new content</p>
                  </div>                  <Switch
                    id="autoModeration"
                    checked={settings.moderation.autoModeration}
                    onCheckedChange={(checked: boolean) => updateModerationSettings('autoModeration', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="contentReviewRequired">Content Review Required</Label>
                    <p className="text-sm text-gray-600">Require manual review for all new listings</p>
                  </div>
                  <Switch
                    id="contentReviewRequired"
                    checked={settings.moderation.contentReviewRequired}
                    onCheckedChange={(checked: boolean) => updateModerationSettings('contentReviewRequired', checked)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minimumSustainabilityScore">Minimum Sustainability Score</Label>                  <Input
                    id="minimumSustainabilityScore"
                    type="number"
                    min="0"
                    max="100"
                    value={settings.moderation.minimumSustainabilityScore}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateModerationSettings('minimumSustainabilityScore', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flagThreshold">Flag Threshold</Label>
                  <Input
                    id="flagThreshold"
                    type="number"
                    min="1"
                    max="10"
                    value={settings.moderation.flagThreshold}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateModerationSettings('flagThreshold', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bannedWords">Banned Words (comma-separated)</Label>                <Textarea
                  id="bannedWords"
                  value={settings.moderation.bannedWords.join(', ')}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateModerationSettings('bannedWords', e.target.value.split(',').map((w: string) => w.trim()))}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Configuration
              </CardTitle>
              <CardDescription>
                Configure SMTP settings for sending emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Label htmlFor="emailEnabled">Email Service Enabled</Label>
                  <p className="text-sm text-gray-600">Enable email notifications and communications</p>
                </div>                <Switch
                  id="emailEnabled"
                  checked={settings.email.enabled}
                  onCheckedChange={(checked: boolean) => updateEmailSettings('enabled', checked)}
                />
              </div>

              {settings.email.enabled && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpHost">SMTP Host</Label>
                      <Input
                        id="smtpHost"
                        value={settings.email.smtpHost}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateEmailSettings('smtpHost', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">SMTP Port</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        value={settings.email.smtpPort}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateEmailSettings('smtpPort', parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpUser">SMTP Username</Label>
                      <Input
                        id="smtpUser"
                        value={settings.email.smtpUser}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateEmailSettings('smtpUser', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpPassword">SMTP Password</Label>
                      <Input
                        id="smtpPassword"
                        type="password"
                        value={settings.email.smtpPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateEmailSettings('smtpPassword', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fromEmail">From Email</Label>
                      <Input
                        id="fromEmail"
                        type="email"
                        value={settings.email.fromEmail}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateEmailSettings('fromEmail', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fromName">From Name</Label>
                      <Input
                        id="fromName"
                        value={settings.email.fromName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateEmailSettings('fromName', e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Analytics & Tracking
              </CardTitle>
              <CardDescription>
                Configure analytics tracking and data retention policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="trackingEnabled">Analytics Tracking</Label>
                  <p className="text-sm text-gray-600">Enable analytics tracking</p>
                </div>                <Switch
                  id="trackingEnabled"
                  checked={settings.analytics.trackingEnabled}
                  onCheckedChange={(checked: boolean) => updateAnalyticsSettings('trackingEnabled', checked)}
                />
              </div>

              {settings.analytics.trackingEnabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="googleAnalyticsId">Google Analytics ID</Label>
                    <Input
                      id="googleAnalyticsId"
                      placeholder="G-XXXXXXXXXX"
                      value={settings.analytics.googleAnalyticsId}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateAnalyticsSettings('googleAnalyticsId', e.target.value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="cookieConsent">Cookie Consent</Label>
                      <p className="text-sm text-gray-600">Show cookie consent banner</p>
                    </div>
                    <Switch
                      id="cookieConsent"
                      checked={settings.analytics.cookieConsent}
                      onCheckedChange={(checked: boolean) => updateAnalyticsSettings('cookieConsent', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dataRetentionDays">Data Retention (Days)</Label>
                    <Input
                      id="dataRetentionDays"
                      type="number"
                      min="30"
                      max="1095"
                      value={settings.analytics.dataRetentionDays}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateAnalyticsSettings('dataRetentionDays', parseInt(e.target.value))}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                API Configuration
              </CardTitle>
              <CardDescription>
                Configure API rate limiting, caching, and CORS settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rateLimit">Rate Limit (requests/minute)</Label>
                  <Input
                    id="rateLimit"
                    type="number"
                    min="10"
                    max="1000"
                    value={settings.api.rateLimit}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateApiSettings('rateLimit', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cacheTTL">Cache TTL (seconds)</Label>
                  <Input
                    id="cacheTTL"
                    type="number"
                    min="60"
                    max="3600"
                    value={settings.api.cacheTTL}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateApiSettings('cacheTTL', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableCors">Enable CORS</Label>
                  <p className="text-sm text-gray-600">Allow cross-origin requests</p>
                </div>
                <Switch
                  id="enableCors"
                  checked={settings.api.enableCors}
                  onCheckedChange={(checked: boolean) => updateApiSettings('enableCors', checked)}
                />
              </div>

              {settings.api.enableCors && (
                <div className="space-y-2">
                  <Label htmlFor="allowedOrigins">Allowed Origins (one per line)</Label>
                  <Textarea
                    id="allowedOrigins"
                    value={settings.api.allowedOrigins.join('\n')}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateApiSettings('allowedOrigins', e.target.value.split('\n').filter((o: string) => o.trim()))}
                    rows={3}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Backup & Recovery
              </CardTitle>
              <CardDescription>
                Configure automated backups and data retention
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="automatedBackup">Automated Backup</Label>
                  <p className="text-sm text-gray-600">Enable scheduled automatic backups</p>
                </div>                <Switch
                  id="automatedBackup"
                  checked={settings.backup.automated}
                  onCheckedChange={(checked: boolean) => updateBackupSettings('automated', checked)}
                />
              </div>

              {settings.backup.automated && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="backupFrequency">Backup Frequency</Label>
                      <select
                        id="backupFrequency"
                        title="Select backup frequency"
                        value={settings.backup.frequency}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateBackupSettings('frequency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="retentionDays">Retention Period (Days)</Label>
                      <Input
                        id="retentionDays"
                        type="number"
                        min="7"
                        max="365"
                        value={settings.backup.retentionDays}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateBackupSettings('retentionDays', parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  {settings.backup.lastBackup && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-800">
                        Last backup: {new Date(settings.backup.lastBackup).toLocaleString()}
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-2">
                <Button onClick={handleRunBackup} disabled={loading} variant="outline">
                  {loading ? 'Running Backup...' : 'Run Manual Backup'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

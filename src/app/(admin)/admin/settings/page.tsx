'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  serviceRequestAlerts: boolean;
  invoiceAlerts: boolean;
  paymentAlerts: boolean;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('notifications');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    serviceRequestAlerts: true,
    invoiceAlerts: true,
    paymentAlerts: true,
  });

  const handleSaveNotifications = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      // await apiService.put('/settings/notifications', notificationSettings);
      setSuccess('Notification settings saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'integrations', label: 'Integrations', icon: '🔗' },
    { id: 'backup', label: 'Backup & Data', icon: '💾' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-dark-800 dark:text-white">Settings</h1>
        <p className="text-dark-500 dark:text-dark-400 text-sm">Configure system settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-dark-200 dark:border-dark-700">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-dark-500 hover:text-dark-700 dark:hover:text-dark-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
          {success}
        </div>
      )}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Notification Settings Tab */}
      {activeTab === 'notifications' && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-dark-800 dark:text-white mb-6">Notification Preferences</h3>
          <div className="space-y-6">
            <div className="border-b border-dark-200 dark:border-dark-700 pb-6">
              <h4 className="font-medium text-dark-800 dark:text-white mb-4">Notification Channels</h4>
              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-dark-700 dark:text-dark-300">Email Notifications</div>
                    <div className="text-sm text-dark-500">Receive notifications via email</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.emailNotifications}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, emailNotifications: e.target.checked })}
                    className="w-5 h-5 rounded border-dark-300 text-primary-500 focus:ring-primary-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-dark-700 dark:text-dark-300">SMS Notifications</div>
                    <div className="text-sm text-dark-500">Receive notifications via SMS</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.smsNotifications}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, smsNotifications: e.target.checked })}
                    className="w-5 h-5 rounded border-dark-300 text-primary-500 focus:ring-primary-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-dark-700 dark:text-dark-300">Push Notifications</div>
                    <div className="text-sm text-dark-500">Receive in-app push notifications</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.pushNotifications}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, pushNotifications: e.target.checked })}
                    className="w-5 h-5 rounded border-dark-300 text-primary-500 focus:ring-primary-500"
                  />
                </label>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-dark-800 dark:text-white mb-4">Alert Types</h4>
              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-dark-700 dark:text-dark-300">Service Request Alerts</div>
                    <div className="text-sm text-dark-500">New and updated service requests</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.serviceRequestAlerts}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, serviceRequestAlerts: e.target.checked })}
                    className="w-5 h-5 rounded border-dark-300 text-primary-500 focus:ring-primary-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-dark-700 dark:text-dark-300">Invoice Alerts</div>
                    <div className="text-sm text-dark-500">Invoice creation and due date reminders</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.invoiceAlerts}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, invoiceAlerts: e.target.checked })}
                    className="w-5 h-5 rounded border-dark-300 text-primary-500 focus:ring-primary-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-dark-700 dark:text-dark-300">Payment Alerts</div>
                    <div className="text-sm text-dark-500">Payment received notifications</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.paymentAlerts}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, paymentAlerts: e.target.checked })}
                    className="w-5 h-5 rounded border-dark-300 text-primary-500 focus:ring-primary-500"
                  />
                </label>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSaveNotifications}
              disabled={saving}
              isLoading={saving}
            >
              Save Changes
            </Button>
          </div>
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-dark-800 dark:text-white mb-6">Integrations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { name: 'WhatsApp Business', description: 'Send notifications via WhatsApp', connected: false, icon: '💬' },
              { name: 'Stripe', description: 'Accept online payments', connected: true, icon: '💳' },
              { name: 'Google Calendar', description: 'Sync appointments and schedules', connected: false, icon: '📅' },
              { name: 'Mailchimp', description: 'Email marketing automation', connected: false, icon: '📧' },
            ].map((integration) => (
              <div key={integration.name} className="border border-dark-200 dark:border-dark-600 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{integration.icon}</span>
                    <div>
                      <h4 className="font-medium text-dark-800 dark:text-white">{integration.name}</h4>
                      <p className="text-sm text-dark-500">{integration.description}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    integration.connected
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-dark-100 text-dark-500 dark:bg-dark-700 dark:text-dark-400'
                  }`}>
                    {integration.connected ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
                <div className="mt-4">
                  <Button
                    variant={integration.connected ? 'danger' : 'primary'}
                    className="w-full"
                  >
                    {integration.connected ? 'Disconnect' : 'Connect'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Backup Tab */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-dark-800 dark:text-white mb-6">Data Backup</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-dark-50 dark:bg-dark-700/50 rounded-xl">
                <div>
                  <div className="font-medium text-dark-800 dark:text-white">Last Backup</div>
                  <div className="text-sm text-dark-500">December 1, 2025 at 03:00 AM</div>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-sm font-medium">
                  Successful
                </span>
              </div>
              <div className="flex gap-3">
                <Button>
                  Create Backup Now
                </Button>
                <Button variant="outline">
                  Download Latest Backup
                </Button>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-dark-800 dark:text-white mb-6">Automatic Backups</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-dark-700 dark:text-dark-300">Enable Automatic Backups</div>
                  <div className="text-sm text-dark-500">Automatically backup data on a schedule</div>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5 rounded border-dark-300 text-primary-500 focus:ring-primary-500"
                />
              </label>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Backup Frequency</label>
                <select className="input-modern dark:bg-dark-700 dark:border-dark-600 max-w-xs">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Retention Period</label>
                <select className="input-modern dark:bg-dark-700 dark:border-dark-600 max-w-xs">
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="365">1 year</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

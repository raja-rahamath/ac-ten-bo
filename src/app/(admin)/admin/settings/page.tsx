'use client';

import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';

interface CompanySettings {
  name: string;
  nameAr?: string;
  email: string;
  phone: string;
  address?: string;
  website?: string;
  logo?: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  fiscalYearStart: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  serviceRequestAlerts: boolean;
  invoiceAlerts: boolean;
  paymentAlerts: boolean;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('company');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: '',
    nameAr: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    logo: '',
    currency: 'BHD',
    timezone: 'Asia/Bahrain',
    dateFormat: 'DD/MM/YYYY',
    fiscalYearStart: '01-01',
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    serviceRequestAlerts: true,
    invoiceAlerts: true,
    paymentAlerts: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // Fetch company settings - in real app this would be an API call
      // For now using mock data
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCompany = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      // await apiService.put('/settings/company', companySettings);
      setSuccess('Company settings saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

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
    { id: 'company', label: 'Company', icon: '🏢' },
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

      {/* Company Settings Tab */}
      {activeTab === 'company' && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-dark-800 dark:text-white mb-6">Company Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={companySettings.name}
                onChange={(e) => setCompanySettings({ ...companySettings, name: e.target.value })}
                className="input-modern dark:bg-dark-700 dark:border-dark-600"
                placeholder="Your Company Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                Company Name (Arabic)
              </label>
              <input
                type="text"
                value={companySettings.nameAr}
                onChange={(e) => setCompanySettings({ ...companySettings, nameAr: e.target.value })}
                className="input-modern dark:bg-dark-700 dark:border-dark-600"
                placeholder="اسم الشركة"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Email</label>
              <input
                type="email"
                value={companySettings.email}
                onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                className="input-modern dark:bg-dark-700 dark:border-dark-600"
                placeholder="info@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Phone</label>
              <input
                type="tel"
                value={companySettings.phone}
                onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                className="input-modern dark:bg-dark-700 dark:border-dark-600"
                placeholder="+973 1234 5678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Website</label>
              <input
                type="url"
                value={companySettings.website}
                onChange={(e) => setCompanySettings({ ...companySettings, website: e.target.value })}
                className="input-modern dark:bg-dark-700 dark:border-dark-600"
                placeholder="https://www.company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Currency</label>
              <select
                value={companySettings.currency}
                onChange={(e) => setCompanySettings({ ...companySettings, currency: e.target.value })}
                className="input-modern dark:bg-dark-700 dark:border-dark-600"
              >
                <option value="BHD">Bahraini Dinar (BHD)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="SAR">Saudi Riyal (SAR)</option>
                <option value="AED">UAE Dirham (AED)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Timezone</label>
              <select
                value={companySettings.timezone}
                onChange={(e) => setCompanySettings({ ...companySettings, timezone: e.target.value })}
                className="input-modern dark:bg-dark-700 dark:border-dark-600"
              >
                <option value="Asia/Bahrain">Asia/Bahrain (GMT+3)</option>
                <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                <option value="Asia/Riyadh">Asia/Riyadh (GMT+3)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Date Format</label>
              <select
                value={companySettings.dateFormat}
                onChange={(e) => setCompanySettings({ ...companySettings, dateFormat: e.target.value })}
                className="input-modern dark:bg-dark-700 dark:border-dark-600"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Address</label>
              <textarea
                value={companySettings.address}
                onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                className="input-modern dark:bg-dark-700 dark:border-dark-600 min-h-[80px]"
                placeholder="Company address"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveCompany}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
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
            <button
              onClick={handleSaveNotifications}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
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
                  <button className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    integration.connected
                      ? 'border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20'
                      : 'bg-primary-500 text-white hover:bg-primary-600'
                  }`}>
                    {integration.connected ? 'Disconnect' : 'Connect'}
                  </button>
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
                <button className="btn-primary">
                  Create Backup Now
                </button>
                <button className="px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700">
                  Download Latest Backup
                </button>
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

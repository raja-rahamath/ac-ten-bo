'use client';

import { useState } from 'react';
import { Button } from '@agentcare/ui';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'security', label: 'Security' },
    { id: 'integrations', label: 'Integrations' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-2 text-gray-600">Manage your account and application settings</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Company Information</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Company Name</label>
                <input
                  type="text"
                  defaultValue="AgentCare Services"
                  className="w-full rounded-lg border p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Contact Email</label>
                <input
                  type="email"
                  defaultValue="contact@agentcare.com"
                  className="w-full rounded-lg border p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Phone</label>
                <input
                  type="tel"
                  defaultValue="+973 1234 5678"
                  className="w-full rounded-lg border p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Timezone</label>
                <select className="w-full rounded-lg border p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                  <option>Asia/Bahrain (GMT+3)</option>
                  <option>Asia/Dubai (GMT+4)</option>
                  <option>Asia/Riyadh (GMT+3)</option>
                </select>
              </div>
            </div>
            <Button className="mt-4">Save Changes</Button>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Localization</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Language</label>
                <select className="w-full rounded-lg border p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                  <option>English</option>
                  <option>Arabic</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Currency</label>
                <select className="w-full rounded-lg border p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                  <option>USD - US Dollar</option>
                  <option>BHD - Bahraini Dinar</option>
                  <option>AED - UAE Dirham</option>
                </select>
              </div>
            </div>
            <Button className="mt-4">Save Changes</Button>
          </div>
        </div>
      )}

      {/* Notifications Settings */}
      {activeTab === 'notifications' && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Notification Preferences</h2>
          <div className="space-y-4">
            {[
              { id: 'new-request', label: 'New Service Request', description: 'Get notified when a new request is created' },
              { id: 'status-update', label: 'Status Updates', description: 'Get notified when request status changes' },
              { id: 'payment-received', label: 'Payment Received', description: 'Get notified when a payment is received' },
              { id: 'daily-summary', label: 'Daily Summary', description: 'Receive a daily summary email' },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" defaultChecked className="peer sr-only" />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                </label>
              </div>
            ))}
          </div>
          <Button className="mt-4">Save Preferences</Button>
        </div>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Change Password</h2>
            <div className="max-w-md space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Current Password</label>
                <input
                  type="password"
                  className="w-full rounded-lg border p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">New Password</label>
                <input
                  type="password"
                  className="w-full rounded-lg border p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Confirm New Password</label>
                <input
                  type="password"
                  className="w-full rounded-lg border p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <Button className="mt-4">Update Password</Button>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Two-Factor Authentication</h2>
            <p className="mb-4 text-gray-600">
              Add an extra layer of security to your account by enabling two-factor authentication.
            </p>
            <Button variant="outline">Enable 2FA</Button>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Active Sessions</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Current Session</p>
                  <p className="text-sm text-gray-500">Chrome on macOS - Active now</p>
                </div>
                <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">Active</span>
              </div>
            </div>
            <Button variant="outline" className="mt-4">
              Sign Out All Other Sessions
            </Button>
          </div>
        </div>
      )}

      {/* Integrations Settings */}
      {activeTab === 'integrations' && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Connected Services</h2>
          <div className="space-y-4">
            {[
              { name: 'AI Service', description: 'LLM-powered chat assistant', status: 'connected' },
              { name: 'Email Service', description: 'Send notifications via email', status: 'disconnected' },
              { name: 'SMS Gateway', description: 'Send SMS notifications', status: 'disconnected' },
              { name: 'Payment Gateway', description: 'Process online payments', status: 'disconnected' },
            ].map((integration) => (
              <div key={integration.name} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">{integration.name}</p>
                  <p className="text-sm text-gray-500">{integration.description}</p>
                </div>
                {integration.status === 'connected' ? (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-800">Connected</span>
                ) : (
                  <Button size="sm" variant="outline">
                    Connect
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

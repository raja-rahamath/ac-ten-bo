'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';

const Icons = {
  company: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  division: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  ),
  department: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  section: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  globe: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  state: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  ),
  district: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  ),
  governorate: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
    </svg>
  ),
  mapPin: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  property: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  propertyType: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  asset: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
    </svg>
  ),
  assetType: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
  complaint: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  inventory: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  briefcase: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  shield: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  chevronRight: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
};

const organizationLinks = [
  { href: '/settings/companies', icon: Icons.company, title: 'Companies', description: 'Manage companies', gradient: 'stat-blue' },
  { href: '/settings/divisions', icon: Icons.division, title: 'Divisions', description: 'Business divisions', gradient: 'stat-purple' },
  { href: '/settings/departments', icon: Icons.department, title: 'Departments', description: 'Manage departments', gradient: 'stat-green' },
  { href: '/settings/sections', icon: Icons.section, title: 'Sections', description: 'Work sections', gradient: 'stat-orange' },
];

const geographicLinks = [
  { href: '/settings/countries', icon: Icons.globe, title: 'Countries', description: 'Manage countries', gradient: 'stat-blue' },
  { href: '/settings/states', icon: Icons.state, title: 'States', description: 'States/Provinces', gradient: 'stat-green' },
  { href: '/settings/districts', icon: Icons.district, title: 'Districts', description: 'Manage districts', gradient: 'stat-purple' },
  { href: '/settings/governorates', icon: Icons.governorate, title: 'Governorates', description: 'Governorates', gradient: 'stat-orange' },
  { href: '/settings/zones', icon: Icons.mapPin, title: 'Zones', description: 'Service zones', gradient: 'stat-pink' },
];

const propertyLinks = [
  { href: '/settings/property-types', icon: Icons.propertyType, title: 'Property Types', description: 'Villa, Apartment, etc.', gradient: 'stat-blue' },
  { href: '/settings/asset-types', icon: Icons.assetType, title: 'Asset Types', description: 'AC, Electrical, etc.', gradient: 'stat-green' },
];

const serviceLinks = [
  { href: '/settings/complaint-types', icon: Icons.complaint, title: 'Complaint Types', description: 'Service issues', gradient: 'stat-orange' },
  { href: '/settings/job-titles', icon: Icons.briefcase, title: 'Job Titles', description: 'Employee positions', gradient: 'stat-purple' },
];

const inventoryLinks = [
  { href: '/settings/inventory-categories', icon: Icons.inventory, title: 'Categories', description: 'Item categories', gradient: 'stat-blue' },
];

const userManagementLinks = [
  { href: '/settings/users', icon: Icons.department, title: 'Users', description: 'System users', gradient: 'stat-blue' },
  { href: '/settings/roles', icon: Icons.shield, title: 'Roles', description: 'Permissions & access', gradient: 'stat-purple' },
];

function SettingsSection({ title, description, links }: { title: string; description: string; links: typeof organizationLinks }) {
  return (
    <div className="card-modern p-6">
      <h3 className="text-lg font-semibold text-dark-800 mb-2">{title}</h3>
      <p className="text-dark-500 text-sm mb-4">{description}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center gap-3 p-3 rounded-xl border border-dark-100 hover:border-primary-200 hover:bg-primary-50/50 transition-all"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.gradient} text-white`}>
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-dark-800 text-sm group-hover:text-primary-500 transition-colors">{item.title}</p>
              <p className="text-xs text-dark-400 truncate">{item.description}</p>
            </div>
            <span className="text-dark-300 group-hover:text-primary-400 transition-colors">{Icons.chevronRight}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('master-data');

  const tabs = [
    { id: 'master-data', label: 'Master Data' },
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
        <div className="flex gap-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition whitespace-nowrap ${
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

      {/* Master Data */}
      {activeTab === 'master-data' && (
        <div className="space-y-6">
          <SettingsSection
            title="Organization Structure"
            description="Manage companies, divisions, departments, and sections"
            links={organizationLinks}
          />
          <SettingsSection
            title="Geographic Hierarchy"
            description="Configure countries, states, districts, governorates, and service zones"
            links={geographicLinks}
          />
          <SettingsSection
            title="Property & Assets"
            description="Define property types and asset categories"
            links={propertyLinks}
          />
          <SettingsSection
            title="Service Configuration"
            description="Configure complaint types and job titles"
            links={serviceLinks}
          />
          <SettingsSection
            title="Inventory"
            description="Manage inventory categories and items"
            links={inventoryLinks}
          />
          <SettingsSection
            title="User Management"
            description="Manage users, roles, and access permissions"
            links={userManagementLinks}
          />
        </div>
      )}

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

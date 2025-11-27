'use client';

import { useEffect, useState } from 'react';
import { Button } from '@agentcare/ui';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  type: 'welcome' | 'notification' | 'reminder' | 'invoice' | 'appointment';
  status: 'active' | 'draft';
  lastModified: string;
  content: string;
  variables: string[];
}

// Mock templates for tenant backoffice
const MOCK_TEMPLATES: EmailTemplate[] = [
  {
    id: '1',
    name: 'Service Request Confirmation',
    subject: 'Your Service Request #{{request_id}} Has Been Received',
    type: 'notification',
    status: 'active',
    lastModified: '2024-11-25T14:30:00Z',
    content: 'Thank you for submitting your service request. Our team will review it shortly.',
    variables: ['{{customer_name}}', '{{request_id}}', '{{service_type}}', '{{scheduled_date}}'],
  },
  {
    id: '2',
    name: 'Appointment Reminder',
    subject: 'Reminder: Your Appointment is Tomorrow',
    type: 'reminder',
    status: 'active',
    lastModified: '2024-11-24T11:15:00Z',
    content: 'This is a friendly reminder about your upcoming appointment.',
    variables: ['{{customer_name}}', '{{appointment_date}}', '{{appointment_time}}', '{{technician_name}}'],
  },
  {
    id: '3',
    name: 'Invoice Generated',
    subject: 'Invoice #{{invoice_number}} for Your Service',
    type: 'invoice',
    status: 'active',
    lastModified: '2024-11-23T16:45:00Z',
    content: 'Your invoice has been generated. Please review and make payment at your convenience.',
    variables: ['{{customer_name}}', '{{invoice_number}}', '{{amount}}', '{{due_date}}', '{{payment_link}}'],
  },
  {
    id: '4',
    name: 'Service Completed',
    subject: 'Your Service Request #{{request_id}} Has Been Completed',
    type: 'notification',
    status: 'active',
    lastModified: '2024-11-22T09:20:00Z',
    content: 'Great news! Your service request has been completed successfully.',
    variables: ['{{customer_name}}', '{{request_id}}', '{{service_type}}', '{{rating_link}}'],
  },
  {
    id: '5',
    name: 'Welcome New Customer',
    subject: 'Welcome to {{company_name}}!',
    type: 'welcome',
    status: 'active',
    lastModified: '2024-11-20T10:30:00Z',
    content: 'Welcome to our service! We are excited to have you as a customer.',
    variables: ['{{customer_name}}', '{{company_name}}', '{{portal_link}}'],
  },
  {
    id: '6',
    name: 'Technician En Route',
    subject: 'Your Technician is On the Way',
    type: 'notification',
    status: 'draft',
    lastModified: '2024-11-18T14:00:00Z',
    content: 'Your assigned technician is now on the way to your location.',
    variables: ['{{customer_name}}', '{{technician_name}}', '{{eta}}', '{{tracking_link}}'],
  },
];

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    subject: '',
    content: '',
    type: 'notification' as EmailTemplate['type'],
    status: 'draft' as EmailTemplate['status'],
  });

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setTemplates(MOCK_TEMPLATES);
      setLoading(false);
    }, 500);
  }, []);

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || template.type === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      welcome: 'bg-purple-100 text-purple-800',
      notification: 'bg-blue-100 text-blue-800',
      reminder: 'bg-yellow-100 text-yellow-800',
      invoice: 'bg-green-100 text-green-800',
      appointment: 'bg-orange-100 text-orange-800',
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
        {type}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
        Active
      </span>
    ) : (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
        Draft
      </span>
    );
  };

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditForm({
      name: template.name,
      subject: template.subject,
      content: template.content,
      type: template.type,
      status: template.status,
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (selectedTemplate) {
      setTemplates(templates.map(t =>
        t.id === selectedTemplate.id
          ? { ...t, ...editForm, lastModified: new Date().toISOString() }
          : t
      ));
    }
    setIsEditing(false);
    setSelectedTemplate(null);
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Email Templates</h1>
          <p className="mt-1 text-gray-600">Manage email templates for customer communications</p>
        </div>
        <Button onClick={() => {
          setSelectedTemplate(null);
          setEditForm({
            name: '',
            subject: '',
            content: '',
            type: 'notification',
            status: 'draft',
          });
          setIsEditing(true);
        }}>
          Create Template
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border px-4 py-2 pl-10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg border px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">All Types</option>
          <option value="welcome">Welcome</option>
          <option value="notification">Notification</option>
          <option value="reminder">Reminder</option>
          <option value="invoice">Invoice</option>
          <option value="appointment">Appointment</option>
        </select>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse rounded-xl bg-white p-6 shadow-sm">
              <div className="h-4 w-3/4 rounded bg-gray-200 mb-3"></div>
              <div className="h-3 w-full rounded bg-gray-200 mb-2"></div>
              <div className="h-3 w-2/3 rounded bg-gray-200"></div>
            </div>
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <span className="text-4xl">📧</span>
          <h3 className="mt-4 text-lg font-medium">No templates found</h3>
          <p className="mt-2 text-gray-600">
            {searchTerm || filterType !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Create your first email template to get started'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="rounded-xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getTypeBadge(template.type)}
                  {getStatusBadge(template.status)}
                </div>
              </div>
              <h3 className="font-semibold mb-1">{template.name}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.subject}</p>
              <p className="text-xs text-gray-500 mb-4 line-clamp-2">{template.content}</p>

              <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Variables:</p>
                <div className="flex flex-wrap gap-1">
                  {template.variables.slice(0, 3).map((v) => (
                    <code key={v} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
                      {v}
                    </code>
                  ))}
                  {template.variables.length > 3 && (
                    <span className="text-xs text-gray-500">+{template.variables.length - 3} more</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-xs text-gray-500">
                  Modified {new Date(template.lastModified).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedTemplate(template)}
                    className="p-2 rounded hover:bg-gray-100 transition-colors"
                    title="Preview"
                  >
                    👁️
                  </button>
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-2 rounded hover:bg-gray-100 transition-colors"
                    title="Edit"
                  >
                    ✏️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {selectedTemplate && !isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="sticky top-0 border-b bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{selectedTemplate.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    {getTypeBadge(selectedTemplate.type)}
                    {getStatusBadge(selectedTemplate.status)}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="p-2 rounded hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <label className="text-xs font-medium text-gray-500">Subject Line</label>
                <p className="mt-1 p-3 rounded-lg bg-gray-50 font-medium">{selectedTemplate.subject}</p>
              </div>

              <div className="mb-6">
                <label className="text-xs font-medium text-gray-500">Content Preview</label>
                <p className="mt-1 p-3 rounded-lg bg-gray-50">{selectedTemplate.content}</p>
              </div>

              <div className="mb-6">
                <label className="text-xs font-medium text-gray-500">Available Variables</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedTemplate.variables.map((v) => (
                    <code key={v} className="rounded bg-blue-100 text-blue-800 px-2 py-1 text-sm">
                      {v}
                    </code>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="text-xs font-medium text-gray-500">Email Preview</label>
                <div className="mt-2 rounded-lg border overflow-hidden">
                  <div className="bg-primary p-6 text-center text-white">
                    <h1 className="text-xl font-bold">Your Company Name</h1>
                  </div>
                  <div className="p-6 bg-white">
                    <p className="text-sm text-gray-600">
                      Hi {'{'}{'{'} customer_name {'}'}{'}'},
                    </p>
                    <p className="mt-4">{selectedTemplate.content}</p>
                    <div className="mt-6">
                      <button className="bg-primary text-white px-6 py-2 rounded-lg text-sm">
                        Take Action
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 text-center text-xs text-gray-500">
                    &copy; 2024 Your Company. All rights reserved.
                  </div>
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 border-t bg-white p-4 flex justify-end gap-3">
              <button
                onClick={() => setSelectedTemplate(null)}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Close
              </button>
              <Button onClick={() => handleEdit(selectedTemplate)}>
                Edit Template
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white shadow-xl">
            <div className="border-b p-6">
              <h2 className="text-lg font-semibold">
                {selectedTemplate ? 'Edit Template' : 'Create New Template'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Template Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="e.g., Service Confirmation"
                  className="w-full rounded-lg border px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subject Line</label>
                <input
                  type="text"
                  value={editForm.subject}
                  onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                  placeholder="e.g., Your Service Request #{{request_id}}"
                  className="w-full rounded-lg border px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value as EmailTemplate['type'] })}
                    className="w-full rounded-lg border px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="welcome">Welcome</option>
                    <option value="notification">Notification</option>
                    <option value="reminder">Reminder</option>
                    <option value="invoice">Invoice</option>
                    <option value="appointment">Appointment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as EmailTemplate['status'] })}
                    className="w-full rounded-lg border px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Content</label>
                <textarea
                  rows={4}
                  value={editForm.content}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  placeholder="Email content with {{variables}}..."
                  className="w-full rounded-lg border px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
              <div className="rounded-lg bg-blue-50 p-3">
                <p className="text-xs text-blue-800">
                  <strong>Tip:</strong> Use {'{'}{'{'} variable_name {'}'}{'}'}  syntax to insert dynamic content like customer names, dates, and IDs.
                </p>
              </div>
            </div>
            <div className="border-t p-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setSelectedTemplate(null);
                }}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <Button onClick={handleSave}>
                {selectedTemplate ? 'Save Changes' : 'Create Template'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

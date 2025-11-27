'use client';

import { useState } from 'react';
import { Button } from '@agentcare/ui';

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const reports = [
    { id: 'requests-summary', name: 'Service Requests Summary', description: 'Overview of all service requests by status and priority' },
    { id: 'employee-performance', name: 'Employee Performance', description: 'Track employee productivity and completed tasks' },
    { id: 'customer-activity', name: 'Customer Activity', description: 'Customer engagement and request history' },
    { id: 'revenue-report', name: 'Revenue Report', description: 'Financial summary of invoices and payments' },
    { id: 'zone-analysis', name: 'Zone Analysis', description: 'Service distribution across different zones' },
    { id: 'complaint-types', name: 'Complaint Types Analysis', description: 'Breakdown of issues by complaint type' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="mt-2 text-gray-600">Generate and view analytics reports</p>
      </div>

      {/* Date Range Filter */}
      <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold">Date Range</h2>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm text-gray-500">From</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="rounded-lg border p-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-500">To</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="rounded-lg border p-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const today = new Date();
                const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                setDateRange({
                  from: weekAgo.toISOString().split('T')[0],
                  to: today.toISOString().split('T')[0],
                });
              }}
              className="rounded-lg bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200"
            >
              Last 7 days
            </button>
            <button
              onClick={() => {
                const today = new Date();
                const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                setDateRange({
                  from: monthAgo.toISOString().split('T')[0],
                  to: today.toISOString().split('T')[0],
                });
              }}
              className="rounded-lg bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200"
            >
              Last 30 days
            </button>
          </div>
        </div>
      </div>

      {/* Report Types */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <div
            key={report.id}
            className={`cursor-pointer rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md ${
              selectedReport === report.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedReport(report.id)}
          >
            <h3 className="mb-2 font-semibold">{report.name}</h3>
            <p className="mb-4 text-sm text-gray-500">{report.description}</p>
            <Button
              size="sm"
              variant={selectedReport === report.id ? 'default' : 'outline'}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedReport(report.id);
              }}
            >
              Generate Report
            </Button>
          </div>
        ))}
      </div>

      {/* Placeholder for report results */}
      {selectedReport && (
        <div className="mt-8 rounded-xl bg-white p-8 shadow-sm">
          <div className="text-center">
            <div className="mb-4 text-6xl">📊</div>
            <h3 className="mb-2 text-lg font-semibold">
              {reports.find((r) => r.id === selectedReport)?.name}
            </h3>
            <p className="mb-4 text-gray-500">
              Report generation feature coming soon. This will display charts and data analytics.
            </p>
            <Button variant="outline">Export to CSV</Button>
          </div>
        </div>
      )}
    </div>
  );
}

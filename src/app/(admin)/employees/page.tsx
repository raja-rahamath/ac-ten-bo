'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';

const Icons = {
  search: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  plus: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  user: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  chevronLeft: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  chevronRight: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  download: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  upload: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  ),
  template: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  filter: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  ),
  x: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

interface Department {
  id: string;
  name: string;
}

interface JobTitle {
  id: string;
  name: string;
}

interface Zone {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isActive: boolean;
  employeeNo: string;
  createdAt: string;
  department?: { name: string };
  jobTitle?: { name: string };
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    errors: { row: number; error: string }[];
  } | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter state
  const [departmentId, setDepartmentId] = useState('');
  const [jobTitleId, setJobTitleId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter options
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);

  // Fetch filter options on mount
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [page, departmentId, jobTitleId, zoneId, search]);

  async function fetchFilterOptions() {
    const token = localStorage.getItem('accessToken');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [deptRes, jobRes, zoneRes] = await Promise.all([
        fetch('http://localhost:4001/api/v1/departments?limit=100', { headers }),
        fetch('http://localhost:4001/api/v1/job-titles?limit=100', { headers }),
        fetch('http://localhost:4001/api/v1/zones?limit=100', { headers }),
      ]);

      const [deptData, jobData, zoneData] = await Promise.all([
        deptRes.json(),
        jobRes.json(),
        zoneRes.json(),
      ]);

      if (deptData.success) setDepartments(deptData.data || []);
      if (jobData.success) setJobTitles(jobData.data || []);
      if (zoneData.success) setZones(zoneData.data || []);
    } catch (error) {
      console.error('Failed to fetch filter options:', error);
    }
  }

  async function fetchEmployees() {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (search) params.set('search', search);
      if (departmentId) params.set('departmentId', departmentId);
      if (jobTitleId) params.set('jobTitleId', jobTitleId);
      if (zoneId) params.set('zoneId', zoneId);

      const response = await fetch(
        `http://localhost:4001/api/v1/employees?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();

      if (data.success) {
        setEmployees(data.data);
        setTotal(data.pagination?.total || 0);
        setTotalPages(Math.ceil((data.pagination?.total || 0) / 20));
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:4001/api/v1/employees/export/excel', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `employees_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export employees');
    } finally {
      setIsExporting(false);
    }
  }

  async function handleDownloadTemplate() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:4001/api/v1/employees/import/template', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'employee_import_template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download template');
    }
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:4001/api/v1/employees/import/excel', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setImportResult(data.data);
        fetchEmployees();
      } else {
        throw new Error(data.error?.message || 'Import failed');
      }
    } catch (error: any) {
      console.error('Import failed:', error);
      alert(error.message || 'Failed to import employees');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  const activeFilterCount = [departmentId, jobTitleId, zoneId].filter(Boolean).length;

  const clearFilters = () => {
    setDepartmentId('');
    setJobTitleId('');
    setZoneId('');
    setPage(1);
  };

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleImport}
        className="hidden"
      />

      {/* Import Result Modal */}
      {importResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl dark:border dark:border-dark-700">
            <h3 className="text-lg font-semibold text-dark-800 dark:text-white mb-4">Import Results</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">{importResult.success}</span>
                <span className="text-emerald-700 dark:text-emerald-300">employees imported successfully</span>
              </div>
              {importResult.failed > 0 && (
                <>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <span className="text-red-600 dark:text-red-400 font-medium">{importResult.failed}</span>
                    <span className="text-red-700 dark:text-red-300">rows failed</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto text-sm">
                    {importResult.errors.map((err, i) => (
                      <p key={i} className="text-red-600 dark:text-red-400 py-1">
                        Row {err.row}: {err.error}
                      </p>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setImportResult(null)}
              className="w-full mt-4 btn-modern btn-primary"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-800 dark:text-white">Employees</h1>
          <p className="text-dark-400 dark:text-dark-500 mt-1">{total} team members</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-600 text-dark-600 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700 transition-colors text-sm font-medium"
            title="Download import template"
          >
            {Icons.template}
            Template
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-600 text-dark-600 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {Icons.upload}
            {isImporting ? 'Importing...' : 'Import'}
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-600 text-dark-600 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {Icons.download}
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
          <Button asChild className="btn-modern btn-primary gap-2">
            <Link href="/employees/new">
              {Icons.plus}
              Add Employee
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[280px] max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-dark-400">
              {Icons.search}
            </div>
            <input
              type="text"
              placeholder="Search by name, email, or employee #..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="input-modern !pl-11"
            />
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors text-sm font-medium ${
              activeFilterCount > 0
                ? 'border-primary-300 bg-primary-50 text-primary-600 dark:border-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                : 'border-dark-200 dark:border-dark-600 text-dark-600 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700'
            }`}
          >
            {Icons.filter}
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary-500 text-white text-xs">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl text-sm font-medium text-dark-500 hover:text-dark-700 dark:text-dark-400 dark:hover:text-dark-200 transition-colors"
            >
              {Icons.x}
              Clear
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 p-4 rounded-xl bg-dark-50 dark:bg-dark-800/50 border border-dark-100 dark:border-dark-700">
            {/* Department Filter */}
            <div className="min-w-[180px]">
              <label className="block text-xs font-medium text-dark-500 dark:text-dark-400 mb-1.5">
                Department
              </label>
              <select
                value={departmentId}
                onChange={(e) => { setDepartmentId(e.target.value); setPage(1); }}
                className="input-modern text-sm"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Job Title Filter */}
            <div className="min-w-[180px]">
              <label className="block text-xs font-medium text-dark-500 dark:text-dark-400 mb-1.5">
                Job Title
              </label>
              <select
                value={jobTitleId}
                onChange={(e) => { setJobTitleId(e.target.value); setPage(1); }}
                className="input-modern text-sm"
              >
                <option value="">All Job Titles</option>
                {jobTitles.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Zone Filter */}
            <div className="min-w-[180px]">
              <label className="block text-xs font-medium text-dark-500 dark:text-dark-400 mb-1.5">
                Zone
              </label>
              <select
                value={zoneId}
                onChange={(e) => { setZoneId(e.target.value); setPage(1); }}
                className="input-modern text-sm"
              >
                <option value="">All Zones</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Employees Table */}
      <div className="card-modern overflow-hidden dark:bg-dark-800 dark:border-dark-700">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500"></div>
              <span className="text-dark-400 dark:text-dark-500 text-sm">Loading employees...</span>
            </div>
          </div>
        ) : employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-dark-100 dark:bg-dark-700 flex items-center justify-center text-dark-400 mb-4">
              {Icons.user}
            </div>
            <p className="text-dark-500 dark:text-dark-400 font-medium">No employees found</p>
            <p className="text-sm text-dark-400 dark:text-dark-500 mt-1">
              {search ? 'Try adjusting your search terms' : 'Add your first team member to get started'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Contact</th>
                    <th>Department</th>
                    <th>Job Title</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee, index) => (
                    <tr
                      key={employee.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-400 to-accent-purple flex items-center justify-center text-white font-medium">
                            {employee.firstName[0]}{employee.lastName[0]}
                          </div>
                          <div>
                            <Link
                              href={`/employees/${employee.id}`}
                              className="font-medium text-dark-800 dark:text-white hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                            >
                              {employee.firstName} {employee.lastName}
                            </Link>
                            <p className="text-xs text-dark-400 dark:text-dark-500">{employee.employeeNo}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <p className="text-dark-700 dark:text-dark-300">{employee.email}</p>
                          <p className="text-xs text-dark-400 dark:text-dark-500">{employee.phone || 'No phone'}</p>
                        </div>
                      </td>
                      <td>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-dark-100 dark:bg-dark-700 text-dark-600 dark:text-dark-300 text-xs font-medium">
                          {employee.department?.name || '-'}
                        </span>
                      </td>
                      <td className="text-dark-600 dark:text-dark-400">{employee.jobTitle?.name || '-'}</td>
                      <td>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          employee.isActive
                            ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800'
                            : 'bg-dark-100 text-dark-500 ring-1 ring-dark-200 dark:bg-dark-700 dark:text-dark-400 dark:ring-dark-600'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${employee.isActive ? 'bg-emerald-500' : 'bg-dark-400'}`}></span>
                          {employee.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/employees/${employee.id}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                        >
                          View
                          {Icons.chevronRight}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-dark-100 dark:border-dark-700 px-6 py-4">
                <p className="text-sm text-dark-500 dark:text-dark-400">
                  Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} employees
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {Icons.chevronLeft}
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                            page === pageNum
                              ? 'bg-primary-500 text-white'
                              : 'hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-600 dark:text-dark-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {Icons.chevronRight}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

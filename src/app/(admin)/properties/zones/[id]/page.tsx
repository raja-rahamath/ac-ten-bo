'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Governorate {
  id: string;
  name: string;
  nameAr?: string;
  district?: { name: string; state?: { name: string } };
}

interface Employee {
  id: string;
  employeeNo: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  jobTitle?: { name: string };
}

interface ZoneTeamMember {
  employee: Employee;
  isPrimary?: boolean;
}

interface ZoneTeam {
  primaryHead: Employee | null;
  secondaryHead: Employee | null;
  technicians: (Employee & { isPrimary?: boolean })[];
  helpers: (Employee & { isPrimary?: boolean })[];
}

interface Zone {
  id: string;
  name: string;
  nameAr?: string;
  code?: string;
  governorateId: string;
  description?: string;
  isActive: boolean;
  governorate?: Governorate;
}

type ZoneRole = 'PRIMARY_HEAD' | 'SECONDARY_HEAD' | 'TECHNICIAN' | 'HELPER';

export default function EditZonePage() {
  const params = useParams();
  const router = useRouter();
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [team, setTeam] = useState<ZoneTeam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'team'>('details');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignRole, setAssignRole] = useState<ZoneRole>('TECHNICIAN');
  const [selectedEmployee, setSelectedEmployee] = useState('');

  const [form, setForm] = useState({
    name: '',
    nameAr: '',
    code: '',
    governorateId: '',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    fetchGovernorates();
    fetchZone();
    fetchTeam();
    fetchEmployees();
  }, [params.id]);

  async function fetchGovernorates() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('${API_URL}/governorates?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setGovernorates(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch governorates:', error);
    }
  }

  async function fetchEmployees() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('${API_URL}/employees?limit=500&isActive=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setEmployees(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  }

  async function fetchZone() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/zones/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        const zone = data.data;
        setForm({
          name: zone.name || '',
          nameAr: zone.nameAr || '',
          code: zone.code || '',
          governorateId: zone.governorateId || '',
          description: zone.description || '',
          isActive: zone.isActive ?? true,
        });
      }
    } catch (error) {
      console.error('Failed to fetch zone:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchTeam() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/zones/${params.id}/team`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setTeam(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch team:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/zones/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          nameAr: form.nameAr || undefined,
          code: form.code || undefined,
          governorateId: form.governorateId,
          description: form.description || undefined,
          isActive: form.isActive,
        }),
      });

      const data = await response.json();
      if (data.success) {
        router.push('/properties?tab=zones');
      } else {
        setError(data.message || 'Failed to update zone');
      }
    } catch (error) {
      console.error('Failed to update zone:', error);
      setError('Failed to update zone');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAssignEmployee() {
    if (!selectedEmployee) return;
    setIsSaving(true);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/zones/${params.id}/team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          employeeId: selectedEmployee,
          role: assignRole,
          isPrimary: false,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowAssignModal(false);
        setSelectedEmployee('');
        fetchTeam();
      } else {
        setError(data.message || 'Failed to assign employee');
      }
    } catch (error) {
      console.error('Failed to assign employee:', error);
      setError('Failed to assign employee');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemoveEmployee(employeeId: string) {
    if (!confirm('Are you sure you want to remove this employee from the zone?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/zones/${params.id}/team/${employeeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        fetchTeam();
      } else {
        setError(data.message || 'Failed to remove employee');
      }
    } catch (error) {
      console.error('Failed to remove employee:', error);
      setError('Failed to remove employee');
    }
  }

  async function handleUpdateHeads(primaryHeadId: string | null, secondaryHeadId: string | null) {
    setIsSaving(true);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/zones/${params.id}/heads`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          primaryHeadId,
          secondaryHeadId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchTeam();
      } else {
        setError(data.message || 'Failed to update zone heads');
      }
    } catch (error) {
      console.error('Failed to update zone heads:', error);
      setError('Failed to update zone heads');
    } finally {
      setIsSaving(false);
    }
  }

  // Get employees not already in the team
  const availableEmployees = employees.filter((emp) => {
    if (!team) return true;
    const teamIds = [
      team.primaryHead?.id,
      team.secondaryHead?.id,
      ...team.technicians.map((t) => t.id),
      ...team.helpers.map((h) => h.id),
    ].filter(Boolean);
    return !teamIds.includes(emp.id);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-dark-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-500"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-dark-800 dark:text-white">Edit Zone</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-dark-100 dark:bg-dark-700 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('details')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'details'
              ? 'bg-white dark:bg-dark-600 text-dark-800 dark:text-white shadow-sm'
              : 'text-dark-500 hover:text-dark-700 dark:hover:text-dark-300'
          }`}
        >
          Zone Details
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'team'
              ? 'bg-white dark:bg-dark-600 text-dark-800 dark:text-white shadow-sm'
              : 'text-dark-500 hover:text-dark-700 dark:hover:text-dark-300'
          }`}
        >
          Zone Team
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Zone Details Tab */}
      {activeTab === 'details' && (
        <div className="rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  Zone Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  Zone Name (Arabic)
                </label>
                <input
                  type="text"
                  value={form.nameAr}
                  onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  Zone Code
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  Governorate *
                </label>
                <select
                  value={form.governorateId}
                  onChange={(e) => setForm({ ...form, governorateId: e.target.value })}
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                  required
                >
                  <option value="">Select Governorate</option>
                  {governorates.map((gov) => (
                    <option key={gov.id} value={gov.id}>
                      {gov.name}
                      {gov.district?.name && ` (${gov.district.name})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none resize-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-dark-300 text-primary-500 focus:ring-primary-500"
              />
              <label htmlFor="isActive" className="text-sm text-dark-700 dark:text-dark-300">
                Active
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <Link
                href="/properties"
                className="flex-1 px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700 text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Zone Team Tab */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          {/* Zone Heads */}
          <div className="rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700 p-6">
            <h3 className="text-lg font-semibold text-dark-800 dark:text-white mb-4">Zone Leadership</h3>
            <div className="grid grid-cols-2 gap-6">
              {/* Primary Head */}
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                  Primary Zone Head
                </label>
                <select
                  value={team?.primaryHead?.id || ''}
                  onChange={(e) => handleUpdateHeads(e.target.value || null, team?.secondaryHead?.id || null)}
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                >
                  <option value="">No Primary Head</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeNo})
                    </option>
                  ))}
                </select>
                {team?.primaryHead && (
                  <p className="mt-2 text-sm text-dark-500">
                    {team.primaryHead.email || team.primaryHead.phone || 'No contact info'}
                  </p>
                )}
              </div>

              {/* Secondary Head */}
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                  Secondary Zone Head (Backup)
                </label>
                <select
                  value={team?.secondaryHead?.id || ''}
                  onChange={(e) => handleUpdateHeads(team?.primaryHead?.id || null, e.target.value || null)}
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                >
                  <option value="">No Secondary Head</option>
                  {employees
                    .filter((emp) => emp.id !== team?.primaryHead?.id)
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeNo})
                      </option>
                    ))}
                </select>
                {team?.secondaryHead && (
                  <p className="mt-2 text-sm text-dark-500">
                    Covers when primary head is on leave
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Technicians */}
          <div className="rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dark-800 dark:text-white">
                Technicians ({team?.technicians?.length || 0})
              </h3>
              <button
                onClick={() => {
                  setAssignRole('TECHNICIAN');
                  setShowAssignModal(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-primary-500 text-white text-sm hover:bg-primary-600"
              >
                + Add Technician
              </button>
            </div>
            {team?.technicians && team.technicians.length > 0 ? (
              <div className="space-y-2">
                {team.technicians.map((tech) => (
                  <div
                    key={tech.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-dark-50 dark:bg-dark-700"
                  >
                    <div>
                      <p className="font-medium text-dark-800 dark:text-white">
                        {tech.firstName} {tech.lastName}
                      </p>
                      <p className="text-sm text-dark-500">{tech.employeeNo}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveEmployee(tech.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-dark-500 text-sm">No technicians assigned to this zone</p>
            )}
          </div>

          {/* Helpers */}
          <div className="rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dark-800 dark:text-white">
                Helpers ({team?.helpers?.length || 0})
              </h3>
              <button
                onClick={() => {
                  setAssignRole('HELPER');
                  setShowAssignModal(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-primary-500 text-white text-sm hover:bg-primary-600"
              >
                + Add Helper
              </button>
            </div>
            {team?.helpers && team.helpers.length > 0 ? (
              <div className="space-y-2">
                {team.helpers.map((helper) => (
                  <div
                    key={helper.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-dark-50 dark:bg-dark-700"
                  >
                    <div>
                      <p className="font-medium text-dark-800 dark:text-white">
                        {helper.firstName} {helper.lastName}
                      </p>
                      <p className="text-sm text-dark-500">{helper.employeeNo}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveEmployee(helper.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-dark-500 text-sm">No helpers assigned to this zone</p>
            )}
          </div>
        </div>
      )}

      {/* Assign Employee Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-800 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-dark-800 dark:text-white mb-4">
              Add {assignRole === 'TECHNICIAN' ? 'Technician' : 'Helper'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  Select Employee
                </label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                >
                  <option value="">Choose an employee...</option>
                  {availableEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeNo})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedEmployee('');
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignEmployee}
                  disabled={!selectedEmployee || isSaving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
                >
                  {isSaving ? 'Adding...' : 'Add to Zone'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

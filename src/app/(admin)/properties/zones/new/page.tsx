'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Governorate {
  id: string;
  name: string;
  nameAr?: string;
  district?: { name: string; state?: { name: string } };
}

export default function NewZonePage() {
  const router = useRouter();
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    nameAr: '',
    code: '',
    governorateId: '',
    description: '',
  });

  useEffect(() => {
    fetchGovernorates();
  }, []);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('${API_URL}/zones', {
        method: 'POST',
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
        }),
      });

      const data = await response.json();
      if (data.success) {
        router.push('/properties?tab=zones');
      } else {
        setError(data.message || 'Failed to create zone');
      }
    } catch (error) {
      console.error('Failed to create zone:', error);
      setError('Failed to create zone');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
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
        <h1 className="text-2xl font-bold text-dark-800 dark:text-white">Add New Zone</h1>
      </div>

      {/* Form */}
      <div className="rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                Zone Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Diplomatic Area"
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
                placeholder="المنطقة الدبلوماسية"
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
                placeholder="e.g., DA-001"
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
              placeholder="Optional description of the zone..."
              rows={3}
              className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none resize-none"
            />
          </div>

          {governorates.length === 0 && (
            <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-sm">
              <p className="font-medium">No governorates found</p>
              <p className="mt-1">
                You need to create a governorate first. Go to Settings to set up the geographic hierarchy
                (Country &gt; State &gt; District &gt; Governorate).
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Link
              href="/properties"
              className="flex-1 px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700 text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading || governorates.length === 0}
              className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create Zone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

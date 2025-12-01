'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiService } from '@/lib/api';

interface Room {
  id: string;
  code: string;
  name: string;
  unit?: {
    id: string;
    name: string;
    building?: {
      name: string;
    };
  };
  roomType?: {
    id: string;
    name: string;
  };
  area?: number;
  isActive: boolean;
  _count?: {
    assets: number;
  };
}

export default function RoomsPage() {
  const searchParams = useSearchParams();
  const unitId = searchParams.get('unitId');

  const [rooms, setRooms] = useState<Room[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterUnit, setFilterUnit] = useState(unitId || '');
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    unitId: '',
    roomTypeId: '',
    area: 0,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [roomsRes, unitsRes, typesRes] = await Promise.all([
        apiService.get('/rooms'),
        apiService.get('/units'),
        apiService.get('/room-types'),
      ]);
      setRooms(roomsRes.data || []);
      setUnits(unitsRes.data || []);
      setRoomTypes(typesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRoom(null);
    setFormData({
      code: '',
      name: '',
      unitId: filterUnit || '',
      roomTypeId: '',
      area: 0,
      isActive: true,
    });
    setError('');
    setShowModal(true);
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      code: room.code,
      name: room.name,
      unitId: room.unit?.id || '',
      roomTypeId: room.roomType?.id || '',
      area: room.area || 0,
      isActive: room.isActive,
    });
    setError('');
    setShowModal(true);
  };

  const handleDelete = async (room: Room) => {
    if (!confirm('Are you sure you want to delete this room?')) return;
    try {
      await apiService.delete(`/rooms/${room.id}`);
      fetchData();
    } catch (error: any) {
      alert(error.message || 'Failed to delete room');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingRoom) {
        await apiService.put(`/rooms/${editingRoom.id}`, formData);
      } else {
        await apiService.post('/rooms', formData);
      }
      setShowModal(false);
      fetchData();
    } catch (error: any) {
      setError(error.message || 'Failed to save room');
    } finally {
      setSaving(false);
    }
  };

  const filteredRooms = rooms.filter(r => {
    if (filterUnit && r.unit?.id !== filterUnit) return false;
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(searchLower) ||
      r.code.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-800 dark:text-white">Rooms</h1>
          <p className="text-dark-500 dark:text-dark-400 text-sm">Manage rooms within units</p>
        </div>
        <button onClick={handleAdd} className="btn-primary flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Room
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search rooms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-modern pl-10"
            />
          </div>
          <select
            value={filterUnit}
            onChange={(e) => setFilterUnit(e.target.value)}
            className="input-modern max-w-xs"
          >
            <option value="">All Units</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>{u.name} - {u.building?.name || 'No Building'}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-50 dark:bg-dark-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase">Room</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase">Unit</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase">Area (sqm)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase">Assets</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100 dark:divide-dark-700">
                {filteredRooms.map((room) => (
                  <tr key={room.id} className="hover:bg-dark-50 dark:hover:bg-dark-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-dark-800 dark:text-white">{room.name}</div>
                      <div className="text-sm text-dark-500">{room.code}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-dark-700 dark:text-dark-300">
                      <div>{room.unit?.name || '-'}</div>
                      <div className="text-xs text-dark-500">{room.unit?.building?.name}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-dark-700 dark:text-dark-300">
                      {room.roomType?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-dark-700 dark:text-dark-300">
                      {room.area || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-dark-700 dark:text-dark-300">
                      {room._count?.assets || 0}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        room.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {room.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(room)} className="p-1.5 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-600 text-dark-500 hover:text-primary-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDelete(room)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-dark-500 hover:text-red-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white dark:bg-dark-800 rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-dark-800 dark:text-white">
                {editingRoom ? 'Edit Room' : 'Add Room'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">{error}</div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="input-modern dark:bg-dark-700 dark:border-dark-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-modern dark:bg-dark-700 dark:border-dark-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Unit *</label>
                <select
                  value={formData.unitId}
                  onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                  className="input-modern dark:bg-dark-700 dark:border-dark-600"
                  required
                >
                  <option value="">Select Unit...</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} - {u.building?.name || 'No Building'}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Room Type</label>
                  <select
                    value={formData.roomTypeId}
                    onChange={(e) => setFormData({ ...formData, roomTypeId: e.target.value })}
                    className="input-modern dark:bg-dark-700 dark:border-dark-600"
                  >
                    <option value="">Select Type...</option>
                    {roomTypes.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Area (sqm)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: parseFloat(e.target.value) || 0 })}
                    className="input-modern dark:bg-dark-700 dark:border-dark-600"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-dark-300 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-dark-600 dark:text-dark-400">Active</span>
              </label>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

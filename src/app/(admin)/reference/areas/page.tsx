'use client';

import ReferenceDataPage from '@/components/ReferenceDataPage';

export default function AreasPage() {
  return (
    <ReferenceDataPage
      title="Areas"
      titleAr="المناطق الفرعية"
      endpoint="/areas"
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'nameAr', label: 'Name (Arabic)' },
        {
          key: 'governorate',
          label: 'Governorate',
          render: (_value, item) => item.governorate?.name || '-',
        },
        {
          key: 'zonesCount',
          label: 'Zones',
          render: (_value, item) => (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              {item._count?.zones || 0} zones
            </span>
          ),
        },
        {
          key: 'isActive',
          label: 'Status',
          render: (value) => (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              value ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {value ? 'Active' : 'Inactive'}
            </span>
          ),
        },
      ]}
      fields={[
        { key: 'code', label: 'Code', type: 'text', placeholder: 'e.g., AREA-001' },
        { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Area name' },
        { key: 'nameAr', label: 'Name (Arabic)', type: 'text', placeholder: 'اسم المنطقة' },
        {
          key: 'governorateId',
          label: 'Governorate',
          type: 'select',
          required: true,
          optionsEndpoint: '/governorates',
          placeholder: 'Select governorate',
        },
        { key: 'isActive', label: 'Active', type: 'checkbox', placeholder: 'Is this area active?' },
      ]}
      filters={[
        {
          key: 'governorateId',
          label: 'Governorate',
          endpoint: '/governorates',
          filterPath: 'governorate.id',
        },
      ]}
      hideDelete
      showToggleActive
      searchPlaceholder="Search areas..."
    />
  );
}

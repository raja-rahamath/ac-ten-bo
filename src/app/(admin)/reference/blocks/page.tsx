'use client';

import ReferenceDataPage from '@/components/ReferenceDataPage';

export default function BlocksPage() {
  return (
    <ReferenceDataPage
      title="Blocks"
      titleAr="الأحياء"
      endpoint="/blocks"
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'nameAr', label: 'Name (Arabic)' },
        {
          key: 'zone',
          label: 'Zone',
          render: (value) => value?.name || '-',
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
        { key: 'code', label: 'Code', type: 'text', required: true, placeholder: 'e.g., B001' },
        { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Block name' },
        { key: 'nameAr', label: 'Name (Arabic)', type: 'text', placeholder: 'اسم الحي' },
        { key: 'zoneId', label: 'Zone', type: 'text', placeholder: 'Zone ID' },
        { key: 'isActive', label: 'Active', type: 'checkbox', placeholder: 'Is this block active?' },
      ]}
      searchPlaceholder="Search blocks..."
    />
  );
}

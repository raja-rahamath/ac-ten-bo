'use client';

import ReferenceDataPage from '@/components/ReferenceDataPage';

export default function AssetTypesPage() {
  return (
    <ReferenceDataPage
      title="Asset Types"
      titleAr="أنواع الأصول"
      endpoint="/asset-types"
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'nameAr', label: 'Name (Arabic)' },
        { key: 'description', label: 'Description' },
        {
          key: 'requiresAmc',
          label: 'Requires AMC',
          render: (value) => (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              value ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
            }`}>
              {value ? 'Yes' : 'No'}
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
        { key: 'code', label: 'Code', type: 'text', required: true, placeholder: 'e.g., AC' },
        { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Asset type name' },
        { key: 'nameAr', label: 'Name (Arabic)', type: 'text', placeholder: 'نوع الأصل' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Description' },
        { key: 'requiresAmc', label: 'Requires AMC', type: 'checkbox', placeholder: 'Does this asset type require AMC?' },
        { key: 'isActive', label: 'Active', type: 'checkbox', placeholder: 'Is this type active?' },
      ]}
      searchPlaceholder="Search asset types..."
    />
  );
}

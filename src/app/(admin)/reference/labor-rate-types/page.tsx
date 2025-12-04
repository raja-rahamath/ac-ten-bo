'use client';

import ReferenceDataPage from '@/components/ReferenceDataPage';

export default function LaborRateTypesPage() {
  return (
    <ReferenceDataPage
      title="Labor Rate Types"
      titleAr="أنواع أسعار العمالة"
      endpoint="/labor-rate-types"
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'nameAr', label: 'Name (Arabic)' },
        {
          key: 'hourlyRate',
          label: 'Hourly Rate',
          render: (value) => (
            <span className="font-mono">
              {value ? Number(value).toFixed(3) : '0.000'} BHD
            </span>
          ),
        },
        {
          key: 'dailyRate',
          label: 'Daily Rate',
          render: (value) => (
            <span className="font-mono">
              {value ? Number(value).toFixed(3) : '0.000'} BHD
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
        { key: 'code', label: 'Code', type: 'text', required: true, placeholder: 'e.g., TECH' },
        { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Labor type name' },
        { key: 'nameAr', label: 'Name (Arabic)', type: 'text', placeholder: 'اسم نوع العمالة' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Description of this labor type' },
        { key: 'hourlyRate', label: 'Hourly Rate (BHD)', type: 'number', required: true, placeholder: '0.000' },
        { key: 'dailyRate', label: 'Daily Rate (BHD)', type: 'number', required: true, placeholder: '0.000' },
        { key: 'sortOrder', label: 'Sort Order', type: 'number', placeholder: '0' },
        { key: 'isActive', label: 'Active', type: 'checkbox', placeholder: 'Is this labor rate type active?' },
      ]}
      searchPlaceholder="Search labor rate types..."
    />
  );
}

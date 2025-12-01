'use client';

import ReferenceDataPage from '@/components/ReferenceDataPage';

export default function CountriesPage() {
  return (
    <ReferenceDataPage
      title="Countries"
      titleAr="الدول"
      endpoint="/countries"
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'nameAr', label: 'Name (Arabic)' },
        { key: 'isoCode', label: 'ISO Code' },
        { key: 'phoneCode', label: 'Phone Code' },
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
        { key: 'code', label: 'Code', type: 'text', required: true, placeholder: 'e.g., BH' },
        { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Country name' },
        { key: 'nameAr', label: 'Name (Arabic)', type: 'text', placeholder: 'اسم الدولة' },
        { key: 'isoCode', label: 'ISO Code', type: 'text', placeholder: 'e.g., BHR' },
        { key: 'phoneCode', label: 'Phone Code', type: 'text', placeholder: 'e.g., +973' },
        { key: 'isActive', label: 'Active', type: 'checkbox', placeholder: 'Is this country active?' },
      ]}
      searchPlaceholder="Search countries..."
    />
  );
}

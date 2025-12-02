'use client';

import ReferenceDataPage from '@/components/ReferenceDataPage';

export default function GovernoratesPage() {
  return (
    <ReferenceDataPage
      title="Governorates"
      titleAr="المحافظات"
      endpoint="/governorates"
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'nameAr', label: 'Name (Arabic)' },
        {
          key: 'districtName',
          label: 'District',
          render: (_value, item) => item.district?.name || '-',
        },
        {
          key: 'stateName',
          label: 'State',
          render: (_value, item) => item.district?.state?.name || '-',
        },
        {
          key: 'countryName',
          label: 'Country',
          render: (_value, item) => item.district?.state?.country?.name || '-',
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
        { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Governorate name' },
        { key: 'nameAr', label: 'Name (Arabic)', type: 'text', placeholder: 'اسم المحافظة' },
        { key: 'code', label: 'Code', type: 'text', placeholder: 'e.g., CAP' },
        // Country dropdown (filter only - not sent to API)
        {
          key: 'countryId',
          label: 'Country',
          type: 'select',
          optionsEndpoint: '/countries',
          isFilterOnly: true,
          filterFromParent: 'district.state.country.id', // Used when editing
        },
        // State dropdown (depends on country, filter only)
        {
          key: 'stateId',
          label: 'State',
          type: 'select',
          optionsEndpoint: '/states',
          dependsOn: 'countryId',
          filterKey: 'countryId',
          isFilterOnly: true,
          filterFromParent: 'district.state.id', // Used when editing
        },
        // District dropdown (depends on state)
        {
          key: 'districtId',
          label: 'District',
          type: 'select',
          required: true,
          optionsEndpoint: '/districts',
          dependsOn: 'stateId',
          filterKey: 'stateId',
        },
        { key: 'isActive', label: 'Active', type: 'checkbox', placeholder: 'Is this governorate active?' },
      ]}
      searchPlaceholder="Search governorates..."
    />
  );
}

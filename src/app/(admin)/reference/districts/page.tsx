'use client';

import ReferenceDataPage from '@/components/ReferenceDataPage';

export default function DistrictsPage() {
  return (
    <ReferenceDataPage
      title="Districts"
      titleAr="المديريات"
      endpoint="/districts"
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'nameAr', label: 'Name (Arabic)' },
        {
          key: 'stateName',
          label: 'State',
          render: (_value, item) => item.state?.name || '-',
        },
        {
          key: 'countryName',
          label: 'Country',
          render: (_value, item) => item.state?.country?.name || '-',
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
        { key: 'code', label: 'Code', type: 'text', required: true, placeholder: 'e.g., D001' },
        { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'District name' },
        { key: 'nameAr', label: 'Name (Arabic)', type: 'text', placeholder: 'اسم المديرية' },
        // Country dropdown (filter only - not sent to API)
        {
          key: 'countryId',
          label: 'Country',
          type: 'select',
          optionsEndpoint: '/countries',
          isFilterOnly: true,
          filterFromParent: 'state.countryId', // Used when editing to get country from state
        },
        // State dropdown (depends on country)
        {
          key: 'stateId',
          label: 'State',
          type: 'select',
          required: true,
          optionsEndpoint: '/states',
          dependsOn: 'countryId',
          filterKey: 'countryId',
        },
        { key: 'isActive', label: 'Active', type: 'checkbox', placeholder: 'Is this district active?' },
      ]}
      searchPlaceholder="Search districts..."
    />
  );
}

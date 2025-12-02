'use client';

import ReferenceDataPage from '@/components/ReferenceDataPage';

export default function ZonesPage() {
  return (
    <ReferenceDataPage
      title="Zones"
      titleAr="المناطق"
      endpoint="/zones"
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'nameAr', label: 'Name (Arabic)' },
        {
          key: 'governorateName',
          label: 'Governorate',
          render: (_value, item) => item.governorate?.name || '-',
        },
        {
          key: 'districtName',
          label: 'District',
          render: (_value, item) => item.governorate?.district?.name || '-',
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
        { key: 'code', label: 'Code', type: 'text', required: true, placeholder: 'e.g., Z001' },
        { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Zone name' },
        { key: 'nameAr', label: 'Name (Arabic)', type: 'text', placeholder: 'اسم المنطقة' },
        // Country dropdown (filter only)
        {
          key: 'countryId',
          label: 'Country',
          type: 'select',
          optionsEndpoint: '/countries',
          isFilterOnly: true,
          filterFromParent: 'governorate.district.state.country.id',
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
          filterFromParent: 'governorate.district.state.id',
        },
        // District dropdown (depends on state, filter only)
        {
          key: 'districtId',
          label: 'District',
          type: 'select',
          optionsEndpoint: '/districts',
          dependsOn: 'stateId',
          filterKey: 'stateId',
          isFilterOnly: true,
          filterFromParent: 'governorate.district.id',
        },
        // Governorate dropdown (depends on district)
        {
          key: 'governorateId',
          label: 'Governorate',
          type: 'select',
          required: true,
          optionsEndpoint: '/governorates',
          dependsOn: 'districtId',
          filterKey: 'districtId',
        },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Optional description' },
        { key: 'isActive', label: 'Active', type: 'checkbox', placeholder: 'Is this zone active?' },
      ]}
      searchPlaceholder="Search zones..."
    />
  );
}

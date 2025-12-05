'use client';

import ReferenceDataPage from '@/components/ReferenceDataPage';

export default function ZonesPage() {
  return (
    <ReferenceDataPage
      title="Zones"
      titleAr="المناطق"
      endpoint="/zones"
      hideDelete={true}
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'nameAr', label: 'Name (Arabic)' },
        {
          key: 'areasCount',
          label: 'Areas',
          render: (_value, item) => {
            const areaNames = item.areas?.map((za: any) => za.area?.name).filter(Boolean) || [];
            return (
              <div className="flex flex-wrap gap-1">
                {areaNames.length > 0 ? (
                  areaNames.slice(0, 3).map((name: string, idx: number) => (
                    <span key={idx} className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {name}
                    </span>
                  ))
                ) : (
                  <span className="text-dark-400 text-xs">No areas</span>
                )}
                {areaNames.length > 3 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-dark-100 text-dark-600 dark:bg-dark-700 dark:text-dark-300">
                    +{areaNames.length - 3} more
                  </span>
                )}
              </div>
            );
          },
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
        { key: 'code', label: 'Code', type: 'text', required: true, placeholder: 'e.g., ZONE-A' },
        { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Zone name' },
        { key: 'nameAr', label: 'Name (Arabic)', type: 'text', placeholder: 'اسم المنطقة' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Optional description' },
        {
          key: 'areaIds',
          label: 'Areas',
          type: 'multiselect',
          optionsEndpoint: '/areas',
          optionLabelKey: 'name',
          optionValueKey: 'id',
          placeholder: 'Select areas for this zone',
          getValuesFromItem: (item: any) => item.areas?.map((za: any) => za.area?.id).filter(Boolean) || [],
        },
        { key: 'isActive', label: 'Active', type: 'checkbox', placeholder: 'Is this zone active?' },
      ]}
      searchPlaceholder="Search zones..."
    />
  );
}

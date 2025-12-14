'use client';

import ReferenceDataPage from '@/components/ReferenceDataPage';

export default function ServiceTypesPage() {
  return (
    <ReferenceDataPage
      title="Service Types"
      titleAr="أنواع الخدمات"
      endpoint="/complaint-types"
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'nameAr', label: 'Name (Arabic)' },
        { key: 'description', label: 'Description' },
        {
          key: 'defaultServiceCharge',
          label: 'Service Charge (BHD)',
          render: (value) => value ? `${parseFloat(value).toFixed(3)} BHD` : '-',
        },
        {
          key: 'priority',
          label: 'Priority',
          render: (value) => {
            const colors: Record<string, string> = {
              LOW: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
              MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
              HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
              URGENT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            };
            return (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[value] || colors.MEDIUM}`}>
                {value || 'Medium'}
              </span>
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
        { key: 'code', label: 'Code', type: 'text', required: true, placeholder: 'e.g., AC_MAINT' },
        { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Service type name' },
        { key: 'nameAr', label: 'Name (Arabic)', type: 'text', placeholder: 'نوع الخدمة' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Description of the service' },
        { key: 'defaultServiceCharge', label: 'Default Service Charge (BHD)', type: 'number', placeholder: '0.000', step: '0.001' },
        {
          key: 'priority',
          label: 'Default Priority',
          type: 'select',
          options: [
            { value: 'LOW', label: 'Low' },
            { value: 'MEDIUM', label: 'Medium' },
            { value: 'HIGH', label: 'High' },
            { value: 'URGENT', label: 'Urgent' },
          ],
        },
        { key: 'isActive', label: 'Active', type: 'checkbox', placeholder: 'Is this service type active?' },
      ]}
      searchPlaceholder="Search service types..."
      hideDelete={true}
      showToggleActive={true}
    />
  );
}

'use client';

import ReferenceDataPage from '@/components/ReferenceDataPage';

export default function JobTitlesPage() {
  return (
    <ReferenceDataPage
      title="Job Titles"
      titleAr="المسميات الوظيفية"
      endpoint="/job-titles"
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'nameAr', label: 'Name (Arabic)' },
        { key: 'description', label: 'Description' },
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
        { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Job title name' },
        { key: 'nameAr', label: 'Name (Arabic)', type: 'text', placeholder: 'اسم الوظيفة' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Job description' },
        { key: 'isActive', label: 'Active', type: 'checkbox', placeholder: 'Is this job title active?' },
      ]}
      searchPlaceholder="Search job titles..."
    />
  );
}

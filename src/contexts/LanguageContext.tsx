'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Language = 'en' | 'ar';
type Direction = 'ltr' | 'rtl';

interface LanguageContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    'service-requests': 'Service Requests',
    customers: 'Customers',
    employees: 'Employees',
    invoices: 'Invoices',
    'email-templates': 'Email Templates',
    reports: 'Reports',
    settings: 'Settings',
    properties: 'Properties',
    leaves: 'Leaves',
    amc: 'AMC',
    quotes: 'Quotes',
    receipts: 'Receipts',
    collections: 'Collections',

    // User menu
    'sign-out': 'Sign out',
    profile: 'Profile',
    'change-password': 'Change Password',
    notifications: 'Notifications',
    'notification-settings': 'Notification Settings',
    'dark-mode': 'Dark Mode',
    'light-mode': 'Light Mode',
    language: 'Language',
    english: 'English',
    arabic: 'Arabic',
    'my-profile': 'My Profile',
    email: 'Email',
    role: 'Role',
    'upload-photo': 'Upload Photo',
    'current-password': 'Current Password',
    'new-password': 'New Password',
    'confirm-password': 'Confirm Password',
    'password-changed': 'Password changed successfully',
    'back-office': 'Back Office',

    // Common actions
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    add: 'Add',
    create: 'Create',
    update: 'Update',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    import: 'Import',
    'view-details': 'View Details',
    close: 'Close',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',

    // Table
    name: 'Name',
    phone: 'Phone',
    status: 'Status',
    date: 'Date',
    actions: 'Actions',
    'no-data': 'No data available',
    loading: 'Loading...',
    'rows-per-page': 'Rows per page',
    'showing': 'Showing',
    'of': 'of',

    // Status
    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending',
    completed: 'Completed',
    cancelled: 'Cancelled',
    'in-progress': 'In Progress',

    // Forms
    required: 'Required',
    optional: 'Optional',
    'select-option': 'Select an option',
    'enter-value': 'Enter a value',
  },
  ar: {
    // Navigation
    dashboard: 'لوحة القيادة',
    'service-requests': 'طلبات الخدمة',
    customers: 'العملاء',
    employees: 'الموظفين',
    invoices: 'الفواتير',
    'email-templates': 'قوالب البريد',
    reports: 'التقارير',
    settings: 'الإعدادات',
    properties: 'العقارات',
    leaves: 'الإجازات',
    amc: 'عقود الصيانة',
    quotes: 'عروض الأسعار',
    receipts: 'الإيصالات',
    collections: 'التحصيلات',

    // User menu
    'sign-out': 'تسجيل الخروج',
    profile: 'الملف الشخصي',
    'change-password': 'تغيير كلمة المرور',
    notifications: 'الإشعارات',
    'notification-settings': 'إعدادات الإشعارات',
    'dark-mode': 'الوضع الداكن',
    'light-mode': 'الوضع الفاتح',
    language: 'اللغة',
    english: 'الإنجليزية',
    arabic: 'العربية',
    'my-profile': 'ملفي الشخصي',
    email: 'البريد الإلكتروني',
    role: 'الدور',
    'upload-photo': 'تحميل صورة',
    'current-password': 'كلمة المرور الحالية',
    'new-password': 'كلمة المرور الجديدة',
    'confirm-password': 'تأكيد كلمة المرور',
    'password-changed': 'تم تغيير كلمة المرور بنجاح',
    'back-office': 'المكتب الخلفي',

    // Common actions
    save: 'حفظ',
    cancel: 'إلغاء',
    edit: 'تعديل',
    delete: 'حذف',
    add: 'إضافة',
    create: 'إنشاء',
    update: 'تحديث',
    search: 'بحث',
    filter: 'تصفية',
    export: 'تصدير',
    import: 'استيراد',
    'view-details': 'عرض التفاصيل',
    close: 'إغلاق',
    confirm: 'تأكيد',
    back: 'رجوع',
    next: 'التالي',
    previous: 'السابق',

    // Table
    name: 'الاسم',
    phone: 'الهاتف',
    status: 'الحالة',
    date: 'التاريخ',
    actions: 'الإجراءات',
    'no-data': 'لا توجد بيانات',
    loading: 'جاري التحميل...',
    'rows-per-page': 'صفوف في الصفحة',
    'showing': 'عرض',
    'of': 'من',

    // Status
    active: 'نشط',
    inactive: 'غير نشط',
    pending: 'قيد الانتظار',
    completed: 'مكتمل',
    cancelled: 'ملغي',
    'in-progress': 'قيد التنفيذ',

    // Forms
    required: 'مطلوب',
    optional: 'اختياري',
    'select-option': 'اختر خياراً',
    'enter-value': 'أدخل قيمة',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang) {
      setLanguageState(savedLang);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      const dir = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.dir = dir;
      document.documentElement.lang = language;
      localStorage.setItem('language', language);
    }
  }, [language, mounted]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const direction: Direction = language === 'ar' ? 'rtl' : 'ltr';

  if (!mounted) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, direction, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

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
    dashboard: 'Dashboard',
    'service-requests': 'Service Requests',
    customers: 'Customers',
    employees: 'Employees',
    invoices: 'Invoices',
    'email-templates': 'Email Templates',
    reports: 'Reports',
    settings: 'Settings',
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
    save: 'Save',
    cancel: 'Cancel',
    'current-password': 'Current Password',
    'new-password': 'New Password',
    'confirm-password': 'Confirm Password',
    'password-changed': 'Password changed successfully',
    'back-office': 'Back Office',
  },
  ar: {
    dashboard: 'لوحة القيادة',
    'service-requests': 'طلبات الخدمة',
    customers: 'العملاء',
    employees: 'الموظفين',
    invoices: 'الفواتير',
    'email-templates': 'قوالب البريد',
    reports: 'التقارير',
    settings: 'الإعدادات',
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
    save: 'حفظ',
    cancel: 'إلغاء',
    'current-password': 'كلمة المرور الحالية',
    'new-password': 'كلمة المرور الجديدة',
    'confirm-password': 'تأكيد كلمة المرور',
    'password-changed': 'تم تغيير كلمة المرور بنجاح',
    'back-office': 'المكتب الخلفي',
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

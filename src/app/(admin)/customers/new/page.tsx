'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

type CustomerType = 'INDIVIDUAL' | 'ORGANIZATION';

const COUNTRY_CODES = [
  { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
  { code: '+968', country: 'Oman', flag: '🇴🇲' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
  { code: '+63', country: 'Philippines', flag: '🇵🇭' },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
  { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+20', country: 'Egypt', flag: '🇪🇬' },
  { code: '+962', country: 'Jordan', flag: '🇯🇴' },
  { code: '+1', country: 'USA/Canada', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
];

function toInitCap(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function NewCustomerPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [customerType, setCustomerType] = useState<CustomerType>('INDIVIDUAL');
  const [countryCode, setCountryCode] = useState('+973');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [altCountryCode, setAltCountryCode] = useState('+973');
  const [altPhoneNumber, setAltPhoneNumber] = useState('');

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [firstNameAr, setFirstNameAr] = useState('');
  const [lastNameAr, setLastNameAr] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgNameAr, setOrgNameAr] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');

  function validateEmail(emailValue: string): boolean {
    if (!emailValue) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) {
    const value = e.target.value.replace(/\D/g, '');
    setter(value);
  }

  function handleEmailBlur() {
    if (email && !validateEmail(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (email && !validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    const fullPhone = phoneNumber ? `${countryCode}${phoneNumber}` : undefined;
    const fullAltPhone = altPhoneNumber ? `${altCountryCode}${altPhoneNumber}` : undefined;

    const formData = new FormData(e.currentTarget);

    try {
      const payload: Record<string, unknown> = {
        customerType,
        email: email || undefined,
        phone: fullPhone,
        altPhone: fullAltPhone,
        isActive: formData.get('status') === 'ACTIVE',
      };

      if (customerType === 'INDIVIDUAL') {
        payload.firstName = firstName;
        payload.lastName = lastName;
        payload.firstNameAr = firstNameAr || undefined;
        payload.lastNameAr = lastNameAr || undefined;
      } else {
        payload.orgName = orgName;
        payload.orgNameAr = orgNameAr || undefined;
        payload.contactPerson = contactPerson || undefined;
      }

      const data = await api.post<{ success: boolean; data: { id: string }; error?: { message: string } }>(
        '/customers',
        payload
      );

      if (data.success) {
        router.push(`/customers/${data.data.id}`);
      } else {
        throw new Error(data.error?.message || 'Failed to create customer');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create customer');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-500 dark:text-dark-400 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-dark-800 dark:text-white">Add New Customer</h1>
          <p className="text-dark-500 dark:text-dark-400">Create a new customer account</p>
        </div>
      </div>

      <div className="rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700 p-8">
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-4 text-sm text-red-600 dark:text-red-400">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Type Selection */}
          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-3">
              Customer Type <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setCustomerType('INDIVIDUAL')}
                className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                  customerType === 'INDIVIDUAL'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-dark-200 dark:border-dark-600 hover:border-dark-300 dark:hover:border-dark-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    customerType === 'INDIVIDUAL' ? 'bg-primary-500 text-white' : 'bg-dark-100 dark:bg-dark-600 text-dark-500'
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className={`font-medium ${customerType === 'INDIVIDUAL' ? 'text-primary-700 dark:text-primary-300' : 'text-dark-700 dark:text-dark-300'}`}>
                      Individual
                    </div>
                    <div className="text-xs text-dark-500">Personal customer</div>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setCustomerType('ORGANIZATION')}
                className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                  customerType === 'ORGANIZATION'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-dark-200 dark:border-dark-600 hover:border-dark-300 dark:hover:border-dark-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    customerType === 'ORGANIZATION' ? 'bg-primary-500 text-white' : 'bg-dark-100 dark:bg-dark-600 text-dark-500'
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className={`font-medium ${customerType === 'ORGANIZATION' ? 'text-primary-700 dark:text-primary-300' : 'text-dark-700 dark:text-dark-300'}`}>
                      Company
                    </div>
                    <div className="text-xs text-dark-500">Business customer</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Individual Fields */}
          {customerType === 'INDIVIDUAL' && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(toInitCap(e.target.value))}
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(toInitCap(e.target.value))}
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    placeholder="Enter last name"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="firstNameAr" className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                    First Name (Arabic)
                  </label>
                  <input
                    id="firstNameAr"
                    type="text"
                    dir="rtl"
                    value={firstNameAr}
                    onChange={(e) => setFirstNameAr(e.target.value)}
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    placeholder="الاسم الأول"
                  />
                </div>
                <div>
                  <label htmlFor="lastNameAr" className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                    Last Name (Arabic)
                  </label>
                  <input
                    id="lastNameAr"
                    type="text"
                    dir="rtl"
                    value={lastNameAr}
                    onChange={(e) => setLastNameAr(e.target.value)}
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    placeholder="اسم العائلة"
                  />
                </div>
              </div>
            </>
          )}

          {/* Organization Fields */}
          {customerType === 'ORGANIZATION' && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="orgName" className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="orgName"
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <label htmlFor="orgNameAr" className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                    Company Name (Arabic)
                  </label>
                  <input
                    id="orgNameAr"
                    type="text"
                    dir="rtl"
                    value={orgNameAr}
                    onChange={(e) => setOrgNameAr(e.target.value)}
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    placeholder="اسم الشركة"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="contactPerson" className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                  Contact Person
                </label>
                <input
                  id="contactPerson"
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(toInitCap(e.target.value))}
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Primary contact person name"
                />
              </div>
            </>
          )}

          {/* Contact Information */}
          <div className="border-t border-dark-100 dark:border-dark-700 pt-6">
            <h3 className="text-sm font-semibold text-dark-700 dark:text-dark-300 mb-4">Contact Information</h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-dark-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); emailError && setEmailError(''); }}
                    onBlur={handleEmailBlur}
                    className={`w-full rounded-xl border bg-white dark:bg-dark-700 px-4 py-2.5 pl-11 text-dark-800 dark:text-white placeholder-dark-400 focus:outline-none focus:ring-1 ${
                      emailError
                        ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500'
                        : 'border-dark-200 dark:border-dark-600 focus:border-primary-500 focus:ring-primary-500'
                    }`}
                    placeholder="customer@example.com"
                  />
                </div>
                {emailError && (
                  <p className="mt-1.5 text-sm text-red-500 dark:text-red-400 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                    </svg>
                    {emailError}
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                    Phone Number
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-[120px] rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2.5 text-dark-800 dark:text-white text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      value={phoneNumber}
                      onChange={(e) => handlePhoneChange(e, setPhoneNumber)}
                      className="flex-1 rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      placeholder="12345678"
                      maxLength={15}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="altPhone" className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                    Alternate Phone
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={altCountryCode}
                      onChange={(e) => setAltCountryCode(e.target.value)}
                      className="w-[120px] rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2.5 text-dark-800 dark:text-white text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <input
                      id="altPhone"
                      type="tel"
                      inputMode="numeric"
                      value={altPhoneNumber}
                      onChange={(e) => handlePhoneChange(e, setAltPhoneNumber)}
                      className="flex-1 rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      placeholder="12345678"
                      maxLength={15}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
              Status
            </label>
            <select
              id="status"
              name="status"
              className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !!emailError}
              className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              ) : (
                'Create Customer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

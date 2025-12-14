'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { useFetch } from '@/hooks/useFetch';

const COUNTRY_CODES = [
  { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+968', country: 'Oman', flag: '🇴🇲' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
  { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
  { code: '+63', country: 'Philippines', flag: '🇵🇭' },
  { code: '+977', country: 'Nepal', flag: '🇳🇵' },
  { code: '+20', country: 'Egypt', flag: '🇪🇬' },
  { code: '+962', country: 'Jordan', flag: '🇯🇴' },
  { code: '+961', country: 'Lebanon', flag: '🇱🇧' },
];

interface Company {
  id: string;
  name: string;
}

interface Division {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

interface JobTitle {
  id: string;
  name: string;
}

interface Zone {
  id: string;
  name: string;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
}

interface Manager {
  id: string;
  firstName: string;
  lastName: string;
  employeeNo: string;
  jobTitle?: { name: string } | null;
}

export default function NewEmployeePage() {
  const router = useRouter();
  const { fetchWithAuth } = useFetch();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [selectedManager, setSelectedManager] = useState('');

  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [isZoneHead, setIsZoneHead] = useState(false);
  const [hasSystemAccess, setHasSystemAccess] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [countryCode, setCountryCode] = useState('+973');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isZoneDropdownOpen, setIsZoneDropdownOpen] = useState(false);
  const [isManagerDropdownOpen, setIsManagerDropdownOpen] = useState(false);
  const [managerSearch, setManagerSearch] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdEmployee, setCreatedEmployee] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    temporaryPassword?: string;
    emailSent?: boolean;
  } | null>(null);

  const zoneDropdownRef = useRef<HTMLDivElement>(null);
  const managerDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (zoneDropdownRef.current && !zoneDropdownRef.current.contains(event.target as Node)) {
        setIsZoneDropdownOpen(false);
      }
      if (managerDropdownRef.current && !managerDropdownRef.current.contains(event.target as Node)) {
        setIsManagerDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchCompanies();
    fetchJobTitles();
    fetchZones();
    fetchRoles();
    fetchManagers();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      fetchDivisions(selectedCompany);
    } else {
      setDivisions([]);
      setSelectedDivision('');
    }
  }, [selectedCompany]);

  useEffect(() => {
    if (selectedDivision) {
      fetchDepartments(selectedDivision);
    } else {
      setDepartments([]);
    }
  }, [selectedDivision]);

  async function fetchCompanies() {
    try {
      const response = await fetchWithAuth('${API_URL}/companies');
      const data = await response.json();
      if (data.success) {
        setCompanies(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    }
  }

  async function fetchDivisions(companyId: string) {
    try {
      const response = await fetchWithAuth(`${API_URL}/divisions?companyId=${companyId}`);
      const data = await response.json();
      if (data.success) {
        setDivisions(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch divisions:', error);
    }
  }

  async function fetchDepartments(divisionId: string) {
    try {
      const response = await fetchWithAuth(`${API_URL}/departments?divisionId=${divisionId}`);
      const data = await response.json();
      if (data.success) {
        setDepartments(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  }

  async function fetchJobTitles() {
    try {
      const response = await fetchWithAuth('${API_URL}/job-titles');
      const data = await response.json();
      if (data.success) {
        setJobTitles(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch job titles:', error);
    }
  }

  async function fetchZones() {
    try {
      const response = await fetchWithAuth('${API_URL}/zones');
      const data = await response.json();
      if (data.success) {
        setZones(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch zones:', error);
    }
  }

  async function fetchRoles() {
    try {
      const response = await fetchWithAuth('${API_URL}/roles');
      const data = await response.json();
      if (data.success) {
        setRoles(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  }

  // Job titles that indicate a manager-eligible role
  const MANAGER_ELIGIBLE_KEYWORDS = [
    'manager', 'head', 'director', 'supervisor', 'lead', 'chief',
    'ceo', 'coo', 'cfo', 'cto', 'gm', 'general manager', 'vp', 'president',
    'coordinator', 'officer', 'executive', 'admin', 'controller', 'specialist'
  ];

  function isManagerEligible(jobTitle?: string | null): boolean {
    if (!jobTitle) return false;
    const title = jobTitle.toLowerCase();
    // Exclude junior-level positions
    const juniorKeywords = ['helper', 'technician', 'assistant', 'trainee', 'intern', 'laborer', 'worker', 'operator', 'cleaner'];
    if (juniorKeywords.some(k => title.includes(k))) return false;
    // Include if it matches manager-eligible keywords or doesn't match junior keywords
    return MANAGER_ELIGIBLE_KEYWORDS.some(k => title.includes(k)) || !juniorKeywords.some(k => title.includes(k));
  }

  async function fetchManagers() {
    try {
      // Fetch all active employees as potential managers
      const response = await fetchWithAuth('${API_URL}/employees?isActive=true&limit=500');
      const data = await response.json();
      if (data.success) {
        // Filter out junior-level employees from managers list
        const eligibleManagers = data.data.filter((m: Manager) => isManagerEligible(m.jobTitle?.name));
        setManagers(eligibleManagers);
      }
    } catch (error) {
      console.error('Failed to fetch managers:', error);
    }
  }

  function handleZoneToggle(zoneId: string) {
    setSelectedZones((prev) =>
      prev.includes(zoneId) ? prev.filter((id) => id !== zoneId) : [...prev, zoneId]
    );
  }

  function validateEmail(emailValue: string): boolean {
    if (!emailValue) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  }

  function handleEmailBlur() {
    if (email && !validateEmail(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.replace(/\D/g, '');
    setPhoneNumber(value);
  }

  // Convert text to InitCap (First Letter Uppercase, rest lowercase)
  function toInitCap(text: string): string {
    return text
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  function handleFirstNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFirstName(toInitCap(e.target.value));
  }

  function handleLastNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLastName(toInitCap(e.target.value));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate email - required if system access is enabled
    if (hasSystemAccess && !email) {
      setEmailError('Email is required for system access');
      setIsLoading(false);
      return;
    }
    if (email && !validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const fullPhone = phoneNumber ? `${countryCode}${phoneNumber}` : undefined;

    try {
      // Convert date to ISO datetime format
      const hireDateValue = formData.get('hireDate') as string;
      const hireDateISO = hireDateValue ? new Date(hireDateValue).toISOString() : undefined;

      const response = await fetchWithAuth('${API_URL}/employees', {
        method: 'POST',
        body: JSON.stringify({
          firstName: firstName,
          lastName: lastName,
          email: email || undefined,
          phone: fullPhone,
          companyId: selectedCompany || undefined,
          divisionId: selectedDivision || undefined,
          departmentId: formData.get('departmentId') || undefined,
          jobTitleId: formData.get('jobTitleId') || undefined,
          hireDate: hireDateISO,
          managerId: selectedManager || undefined,
          hasSystemAccess: hasSystemAccess,
          roleId: hasSystemAccess && selectedRole ? selectedRole : undefined,
          zoneIds: selectedZones.length > 0 ? selectedZones : undefined,
          isZoneHead: isZoneHead,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || data.message || 'Failed to create employee');
      }

      // If employee has system access and temp password, show success modal
      if (data.data.temporaryPassword) {
        setCreatedEmployee({
          id: data.data.id,
          firstName: data.data.firstName,
          lastName: data.data.lastName,
          email: data.data.email,
          temporaryPassword: data.data.temporaryPassword,
          emailSent: data.data.emailSent,
        });
        setShowSuccessModal(true);
      } else {
        // No system access, redirect directly
        router.push(`/employees/${data.data.id}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-dark-500 hover:text-dark-700 dark:text-dark-400 dark:hover:text-dark-200">
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-dark-800 dark:text-white">Add New Employee</h1>
      </div>

      <div className="rounded-xl bg-white dark:bg-dark-800 p-8 shadow-sm border border-dark-100 dark:border-dark-700">
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-600">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="border-b border-dark-100 dark:border-dark-700 pb-4">
            <h3 className="font-semibold text-dark-800 dark:text-white mb-4">Personal Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="mb-2 block font-medium text-dark-700 dark:text-dark-300">
                  First Name *
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={firstName}
                  onChange={handleFirstNameChange}
                  className="w-full rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 p-3 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="John"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="mb-2 block font-medium text-dark-700 dark:text-dark-300">
                  Last Name *
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={lastName}
                  onChange={handleLastNameChange}
                  className="w-full rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 p-3 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Doe"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="border-b border-dark-100 dark:border-dark-700 pb-4">
            <h3 className="font-semibold text-dark-800 dark:text-white mb-4">Contact Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="email" className="mb-2 block font-medium text-dark-700 dark:text-dark-300">
                  Email {hasSystemAccess ? (
                    <span className="text-red-500">*</span>
                  ) : (
                    <span className="text-dark-400 dark:text-dark-500 text-sm">(Optional)</span>
                  )}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  onBlur={handleEmailBlur}
                  required={hasSystemAccess}
                  className={`w-full rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 p-3 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 ${
                    emailError ? 'border-red-500' : ''
                  }`}
                  placeholder="employee@company.com"
                />
                {emailError && <p className="mt-1 text-sm text-red-500">{emailError}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="mb-2 block font-medium text-dark-700 dark:text-dark-300">
                  Contact Number
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-28 rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 p-3 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    {COUNTRY_CODES.map((cc) => (
                      <option key={cc.code} value={cc.code}>
                        {cc.flag} {cc.code}
                      </option>
                    ))}
                  </select>
                  <input
                    id="phone"
                    type="text"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    className="flex-1 rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 p-3 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    placeholder="12345678"
                    maxLength={15}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Organization */}
          <div className="border-b border-dark-100 dark:border-dark-700 pb-4">
            <h3 className="font-semibold text-dark-800 dark:text-white mb-4">Organization</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="companyId" className="mb-2 block font-medium text-dark-700 dark:text-dark-300">
                  Company
                </label>
                <select
                  id="companyId"
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="w-full rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 p-3 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">Select company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="divisionId" className="mb-2 block font-medium text-dark-700 dark:text-dark-300">
                  Division
                </label>
                <select
                  id="divisionId"
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                  className="w-full rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 p-3 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!selectedCompany}
                >
                  <option value="">Select division</option>
                  {divisions.map((division) => (
                    <option key={division.id} value={division.id}>
                      {division.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="departmentId" className="mb-2 block font-medium text-dark-700 dark:text-dark-300">
                  Department
                </label>
                <select
                  id="departmentId"
                  name="departmentId"
                  className="w-full rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 p-3 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!selectedDivision}
                >
                  <option value="">Select department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="jobTitleId" className="mb-2 block font-medium text-dark-700 dark:text-dark-300">
                  Job Title
                </label>
                <select
                  id="jobTitleId"
                  name="jobTitleId"
                  className="w-full rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 p-3 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">Select job title</option>
                  {jobTitles.map((jt) => (
                    <option key={jt.id} value={jt.id}>
                      {jt.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="managerId" className="mb-2 block font-medium text-dark-700 dark:text-dark-300">
                  Reporting Manager <span className="text-dark-400 dark:text-dark-500 text-sm">(CEO/Top level: leave empty)</span>
                </label>
                <div className="relative" ref={managerDropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsManagerDropdownOpen(!isManagerDropdownOpen);
                      setManagerSearch('');
                    }}
                    className="w-full rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 p-3 text-left text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 flex items-center justify-between"
                  >
                    <span className={!selectedManager ? 'text-dark-400' : ''}>
                      {selectedManager
                        ? (() => {
                            const manager = managers.find((m) => m.id === selectedManager);
                            return manager
                              ? `${manager.firstName} ${manager.lastName} (${manager.employeeNo})${manager.jobTitle?.name ? ` - ${manager.jobTitle.name}` : ''}`
                              : 'Select manager...';
                          })()
                        : 'No reporting manager (Top Level)'}
                    </span>
                    <svg
                      className={`w-5 h-5 text-dark-400 transition-transform ${isManagerDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isManagerDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-600 rounded-lg shadow-lg">
                      <div className="p-2 border-b border-dark-200 dark:border-dark-600">
                        <input
                          type="text"
                          placeholder="Search managers..."
                          value={managerSearch}
                          onChange={(e) => setManagerSearch(e.target.value)}
                          className="w-full rounded border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2 text-sm text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        <div
                          className="px-3 py-2 hover:bg-dark-50 dark:hover:bg-dark-700 cursor-pointer text-dark-500 dark:text-dark-400 text-sm"
                          onClick={() => {
                            setSelectedManager('');
                            setIsManagerDropdownOpen(false);
                          }}
                        >
                          No reporting manager (Top Level)
                        </div>
                        {managers
                          .filter((manager) => {
                            if (!managerSearch) return true;
                            const search = managerSearch.toLowerCase();
                            return (
                              manager.firstName.toLowerCase().includes(search) ||
                              manager.lastName.toLowerCase().includes(search) ||
                              manager.employeeNo.toLowerCase().includes(search) ||
                              (manager.jobTitle?.name?.toLowerCase().includes(search) ?? false)
                            );
                          })
                          .map((manager) => (
                            <div
                              key={manager.id}
                              className={`px-3 py-2 hover:bg-dark-50 dark:hover:bg-dark-700 cursor-pointer text-sm ${
                                selectedManager === manager.id
                                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                  : 'text-dark-800 dark:text-white'
                              }`}
                              onClick={() => {
                                setSelectedManager(manager.id);
                                setIsManagerDropdownOpen(false);
                              }}
                            >
                              <div className="font-medium">
                                {manager.firstName} {manager.lastName} ({manager.employeeNo})
                              </div>
                              {manager.jobTitle?.name && (
                                <div className="text-xs text-dark-500 dark:text-dark-400">{manager.jobTitle.name}</div>
                              )}
                            </div>
                          ))}
                        {managers.filter((manager) => {
                          if (!managerSearch) return true;
                          const search = managerSearch.toLowerCase();
                          return (
                            manager.firstName.toLowerCase().includes(search) ||
                            manager.lastName.toLowerCase().includes(search) ||
                            manager.employeeNo.toLowerCase().includes(search) ||
                            (manager.jobTitle?.name?.toLowerCase().includes(search) ?? false)
                          );
                        }).length === 0 && (
                          <div className="p-3 text-dark-500 dark:text-dark-400 text-sm text-center">
                            No managers found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Zone Assignment */}
          <div className="border-b border-dark-100 dark:border-dark-700 pb-4">
            <h3 className="font-semibold text-dark-800 dark:text-white mb-4">Zone Assignment</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Multi-select Zone Dropdown */}
              <div>
                <label className="mb-2 block font-medium text-dark-700 dark:text-dark-300">
                  Assigned Zones
                </label>
                <div className="relative" ref={zoneDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsZoneDropdownOpen(!isZoneDropdownOpen)}
                    className="w-full rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 p-3 text-left text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 flex items-center justify-between"
                  >
                    <span className={selectedZones.length === 0 ? 'text-dark-400' : ''}>
                      {selectedZones.length === 0
                        ? 'Select zones...'
                        : `${selectedZones.length} zone${selectedZones.length > 1 ? 's' : ''} selected`}
                    </span>
                    <svg
                      className={`w-5 h-5 text-dark-400 transition-transform ${isZoneDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isZoneDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {zones.length === 0 ? (
                        <div className="p-3 text-dark-500 dark:text-dark-400 text-sm">No zones available</div>
                      ) : (
                        zones.map((zone) => (
                          <label
                            key={zone.id}
                            className="flex items-center gap-3 px-3 py-2 hover:bg-dark-50 dark:hover:bg-dark-700 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedZones.includes(zone.id)}
                              onChange={() => handleZoneToggle(zone.id)}
                              className="w-4 h-4 rounded border-dark-300 text-primary-500 focus:ring-primary-500"
                            />
                            <span className="text-dark-800 dark:text-white text-sm">{zone.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {/* Selected zones tags */}
                {selectedZones.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedZones.map((zoneId) => {
                      const zone = zones.find((z) => z.id === zoneId);
                      return (
                        <span
                          key={zoneId}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded text-xs"
                        >
                          {zone?.name}
                          <button
                            type="button"
                            onClick={() => handleZoneToggle(zoneId)}
                            className="hover:text-primary-900 dark:hover:text-primary-100"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Zone Head Toggle */}
              <div>
                <label className="mb-2 block font-medium text-dark-700 dark:text-dark-300">
                  Zone Head
                </label>
                <div className="flex items-center gap-3 h-[46px]">
                  <button
                    type="button"
                    onClick={() => setIsZoneHead(!isZoneHead)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isZoneHead ? 'bg-primary-500' : 'bg-dark-300 dark:bg-dark-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isZoneHead ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-dark-600 dark:text-dark-400 text-sm">
                    {isZoneHead ? 'Yes' : 'No'}
                  </span>
                  {isZoneHead && (
                    <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs rounded-full font-medium">
                      Leadership
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Employment Details */}
          <div>
            <h3 className="font-semibold text-dark-800 dark:text-white mb-4">Employment Details</h3>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="hireDate" className="mb-2 block font-medium text-dark-700 dark:text-dark-300">
                    Hire Date
                  </label>
                  <input
                    id="hireDate"
                    name="hireDate"
                    type="date"
                    className="w-full rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 p-3 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* System Access Toggle */}
              <div className="p-4 rounded-xl bg-dark-50 dark:bg-dark-700/50 border border-dark-100 dark:border-dark-600">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="font-medium text-dark-800 dark:text-white">System Access</label>
                    <p className="text-sm text-dark-500 dark:text-dark-400">Allow this employee to login to the system</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setHasSystemAccess(!hasSystemAccess);
                      if (hasSystemAccess) {
                        setSelectedRole(''); // Clear role when disabling access
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      hasSystemAccess ? 'bg-primary-500' : 'bg-dark-300 dark:bg-dark-500'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        hasSystemAccess ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Role Selection - only visible when system access is enabled */}
                {hasSystemAccess && (
                  <div className="pt-4 border-t border-dark-200 dark:border-dark-600">
                    <label htmlFor="roleId" className="mb-2 block font-medium text-dark-700 dark:text-dark-300">
                      System Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="roleId"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      required={hasSystemAccess}
                      className="w-full rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 p-3 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="">Select a role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.displayName}
                        </option>
                      ))}
                    </select>
                    {selectedRole && (
                      <p className="mt-2 text-sm text-dark-500 dark:text-dark-400">
                        {roles.find((r) => r.id === selectedRole)?.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Creating...' : 'Create Employee'}
            </Button>
          </div>
        </form>
      </div>

      {/* Success Modal with Temporary Password */}
      {showSuccessModal && createdEmployee && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-dark-800 dark:text-white text-center mb-2">
              Employee Created Successfully!
            </h2>

            {/* Employee Name */}
            <p className="text-dark-600 dark:text-dark-300 text-center mb-6">
              <span className="font-semibold">{createdEmployee.firstName} {createdEmployee.lastName}</span> has been added with system access.
            </p>

            {/* Credentials Box */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="font-semibold text-amber-800 dark:text-amber-300">Login Credentials</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-dark-500 dark:text-dark-400 text-sm">Email:</span>
                  <span className="text-dark-800 dark:text-white font-medium text-sm">{createdEmployee.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-dark-500 dark:text-dark-400 text-sm">Temporary Password:</span>
                  <code className="bg-dark-100 dark:bg-dark-700 px-2 py-1 rounded text-sm font-mono text-dark-800 dark:text-white">
                    {createdEmployee.temporaryPassword}
                  </code>
                </div>
              </div>
            </div>

            {/* Copy Password Button */}
            <button
              type="button"
              onClick={() => {
                if (createdEmployee.temporaryPassword) {
                  navigator.clipboard.writeText(createdEmployee.temporaryPassword);
                }
              }}
              className="w-full mb-3 px-4 py-2 bg-dark-100 dark:bg-dark-700 hover:bg-dark-200 dark:hover:bg-dark-600 text-dark-700 dark:text-dark-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Password to Clipboard
            </button>

            {/* Email Status */}
            {createdEmployee.emailSent ? (
              <p className="text-sm text-green-600 dark:text-green-400 text-center mb-4 flex items-center justify-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Welcome email sent to {createdEmployee.email}
              </p>
            ) : (
              <p className="text-sm text-amber-600 dark:text-amber-400 text-center mb-4 flex items-center justify-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Email not configured - please share credentials manually
              </p>
            )}

            {/* Warning */}
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-3 mb-6 rounded-r-lg">
              <p className="text-sm text-red-700 dark:text-red-300">
                <strong>Important:</strong> This password is shown only once. Please save it or share it with the employee securely.
              </p>
            </div>

            {/* Action Button */}
            <Button
              type="button"
              onClick={() => router.push(`/employees/${createdEmployee.id}`)}
              className="w-full"
            >
              View Employee Profile
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

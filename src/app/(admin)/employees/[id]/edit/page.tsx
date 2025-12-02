'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

interface Manager {
  id: string;
  firstName: string;
  lastName: string;
  employeeNo: string;
  jobTitle?: { name: string } | null;
}

interface Employee {
  id: string;
  employeeNo: string;
  firstName: string;
  lastName: string;
  firstNameAr?: string;
  lastNameAr?: string;
  email?: string;
  phone?: string;
  nationalId?: string;
  dateOfBirth?: string;
  hireDate?: string;
  isActive: boolean;
  hasSystemAccess: boolean;
  companyId?: string;
  divisionId?: string;
  departmentId?: string;
  sectionId?: string;
  jobTitleId?: string;
  managerId?: string;
  company?: { id: string; name: string };
  division?: { id: string; name: string };
  department?: { id: string; name: string };
  section?: { id: string; name: string };
  jobTitle?: { id: string; name: string };
  manager?: { id: string; firstName: string; lastName: string };
  zoneAssignments?: { zone: { id: string; name: string }; isPrimary: boolean }[];
  user?: { id: string; role?: { id: string; name: string; displayName: string } };
}

export default function EditEmployeePage() {
  const params = useParams();
  const router = useRouter();
  const { fetchWithAuth } = useFetch();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [employee, setEmployee] = useState<Employee | null>(null);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [firstNameAr, setFirstNameAr] = useState('');
  const [lastNameAr, setLastNameAr] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [countryCode, setCountryCode] = useState('+973');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [hireDate, setHireDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedJobTitle, setSelectedJobTitle] = useState('');
  const [selectedManager, setSelectedManager] = useState('');
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [isZoneDropdownOpen, setIsZoneDropdownOpen] = useState(false);

  const zoneDropdownRef = useRef<HTMLDivElement>(null);

  // Close zone dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (zoneDropdownRef.current && !zoneDropdownRef.current.contains(event.target as Node)) {
        setIsZoneDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch employee and reference data on mount
  useEffect(() => {
    fetchEmployee();
    fetchCompanies();
    fetchJobTitles();
    fetchZones();
    fetchManagers();
  }, [params.id]);

  // Fetch divisions when company changes
  useEffect(() => {
    if (selectedCompany) {
      fetchDivisions(selectedCompany);
    } else {
      setDivisions([]);
      setSelectedDivision('');
    }
  }, [selectedCompany]);

  // Fetch departments when division changes
  useEffect(() => {
    if (selectedDivision) {
      fetchDepartments(selectedDivision);
    } else {
      setDepartments([]);
      setSelectedDepartment('');
    }
  }, [selectedDivision]);

  async function fetchEmployee() {
    try {
      const response = await fetchWithAuth(`http://localhost:4001/api/v1/employees/${params.id}`);
      const data = await response.json();

      if (data.success) {
        const emp = data.data as Employee;
        setEmployee(emp);

        // Populate form fields
        setFirstName(emp.firstName || '');
        setLastName(emp.lastName || '');
        setFirstNameAr(emp.firstNameAr || '');
        setLastNameAr(emp.lastNameAr || '');

        // Handle email - don't show placeholder emails
        const displayEmail = emp.email?.includes('@noemail.local') ? '' : emp.email || '';
        setEmail(displayEmail);

        // Parse phone number
        if (emp.phone) {
          const phoneMatch = emp.phone.match(/^(\+\d{1,4})(.*)$/);
          if (phoneMatch) {
            setCountryCode(phoneMatch[1]);
            setPhoneNumber(phoneMatch[2]);
          } else {
            setPhoneNumber(emp.phone);
          }
        }

        setNationalId(emp.nationalId || '');
        setDateOfBirth(emp.dateOfBirth ? emp.dateOfBirth.split('T')[0] : '');
        setHireDate(emp.hireDate ? emp.hireDate.split('T')[0] : '');
        setIsActive(emp.isActive);
        setSelectedCompany(emp.companyId || emp.company?.id || '');
        setSelectedDivision(emp.divisionId || emp.division?.id || '');
        setSelectedDepartment(emp.departmentId || emp.department?.id || '');
        setSelectedJobTitle(emp.jobTitleId || emp.jobTitle?.id || '');
        setSelectedManager(emp.managerId || emp.manager?.id || '');

        // Set zones from zone assignments
        if (emp.zoneAssignments) {
          setSelectedZones(emp.zoneAssignments.map(za => za.zone.id));
        }
      }
    } catch (error) {
      console.error('Failed to fetch employee:', error);
      setError('Failed to load employee data');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchCompanies() {
    try {
      const response = await fetchWithAuth('http://localhost:4001/api/v1/companies');
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
      const response = await fetchWithAuth(`http://localhost:4001/api/v1/divisions?companyId=${companyId}`);
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
      const response = await fetchWithAuth(`http://localhost:4001/api/v1/departments?divisionId=${divisionId}`);
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
      const response = await fetchWithAuth('http://localhost:4001/api/v1/job-titles');
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
      const response = await fetchWithAuth('http://localhost:4001/api/v1/zones');
      const data = await response.json();
      if (data.success) {
        setZones(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch zones:', error);
    }
  }

  async function fetchManagers() {
    try {
      const response = await fetchWithAuth('http://localhost:4001/api/v1/employees?isActive=true&limit=100');
      const data = await response.json();
      if (data.success) {
        // Filter out current employee from managers list
        setManagers(data.data.filter((m: Manager) => m.id !== params.id));
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
    if (!emailValue) return true;
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

  function toInitCap(text: string): string {
    return text
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    if (email && !validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      setIsSaving(false);
      return;
    }

    const fullPhone = phoneNumber ? `${countryCode}${phoneNumber}` : undefined;

    try {
      const hireDateISO = hireDate ? new Date(hireDate).toISOString() : undefined;
      const dateOfBirthISO = dateOfBirth ? new Date(dateOfBirth).toISOString() : undefined;

      const response = await fetchWithAuth(`http://localhost:4001/api/v1/employees/${params.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          firstName,
          lastName,
          firstNameAr: firstNameAr || undefined,
          lastNameAr: lastNameAr || undefined,
          email: email || undefined,
          phone: fullPhone,
          nationalId: nationalId || undefined,
          dateOfBirth: dateOfBirthISO,
          hireDate: hireDateISO,
          companyId: selectedCompany || undefined,
          divisionId: selectedDivision || undefined,
          departmentId: selectedDepartment || undefined,
          jobTitleId: selectedJobTitle || undefined,
          managerId: selectedManager || undefined,
          isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || data.message || 'Failed to update employee');
      }

      router.push(`/employees/${params.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-dark-500 dark:text-dark-400">Loading...</div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-dark-500 dark:text-dark-400">Employee not found</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-dark-500 hover:text-dark-700 dark:text-dark-400 dark:hover:text-dark-200">
          ← Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-dark-800 dark:text-white">Edit Employee</h1>
          <p className="text-dark-500 dark:text-dark-400">{employee.employeeNo}</p>
        </div>
      </div>

      <div className="rounded-xl bg-white dark:bg-dark-800 p-8 shadow-sm border border-dark-100 dark:border-dark-700">
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-600 dark:text-red-400">{error}</div>
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
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(toInitCap(e.target.value))}
                  className="w-full rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 p-3 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="mb-2 block font-medium text-dark-700 dark:text-dark-300">
                  Last Name *
                </label>
                <input
                  id="lastName"
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(toInitCap(e.target.value))}
                  className="w-full rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 p-3 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label htmlFor="firstNameAr" className="mb-2 block font-medium text-dark-700 dark:text-dark-300">
                  First Name (Arabic)
                </label>
                <input
                  id="firstNameAr"
                  type="text"
                  value={firstNameAr}
                  onChange={(e) => setFirstNameAr(e.target.value)}
                  dir="rtl"
                  className="w-full rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 p-3 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label htmlFor="lastNameAr" className="mb-2 block font-medium text-dark-700 dark:text-dark-300">
                  Last Name (Arabic)
                </label>
                <input
                  id="lastNameAr"
                  type="text"
                  value={lastNameAr}
                  onChange={(e) => setLastNameAr(e.target.value)}
                  dir="rtl"
                  className="w-full rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 p-3 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label htmlFor="nationalId" className="mb-2 block font-medium text-dark-700 dark:text-dark-300">
                  National ID / CPR
                </label>
                <input
                  id="nationalId"
                  type="text"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  className="w-full rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 p-3 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label htmlFor="dateOfBirth" className="mb-2 block font-medium text-dark-700 dark:text-dark-300">
                  Date of Birth
                </label>
                <input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 p-3 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
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
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  onBlur={handleEmailBlur}
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
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
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
                  value={selectedJobTitle}
                  onChange={(e) => setSelectedJobTitle(e.target.value)}
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
                  Reporting Manager
                </label>
                <select
                  id="managerId"
                  value={selectedManager}
                  onChange={(e) => setSelectedManager(e.target.value)}
                  className="w-full rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 p-3 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">No reporting manager (Top Level)</option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.firstName} {manager.lastName} ({manager.employeeNo}){manager.jobTitle?.name ? ` - ${manager.jobTitle.name}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Zone Assignment */}
          <div className="border-b border-dark-100 dark:border-dark-700 pb-4">
            <h3 className="font-semibold text-dark-800 dark:text-white mb-4">Zone Assignment</h3>
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
          </div>

          {/* Employment Details */}
          <div>
            <h3 className="font-semibold text-dark-800 dark:text-white mb-4">Employment Details</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="hireDate" className="mb-2 block font-medium text-dark-700 dark:text-dark-300">
                  Hire Date
                </label>
                <input
                  id="hireDate"
                  type="date"
                  value={hireDate}
                  onChange={(e) => setHireDate(e.target.value)}
                  className="w-full rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 p-3 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="mb-2 block font-medium text-dark-700 dark:text-dark-300">
                  Status
                </label>
                <div className="flex items-center gap-3 h-[46px]">
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isActive ? 'bg-green-500' : 'bg-dark-300 dark:bg-dark-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isActive ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`font-medium ${isActive ? 'text-green-600 dark:text-green-400' : 'text-dark-500 dark:text-dark-400'}`}>
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
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
            <Button type="submit" disabled={isSaving} className="flex-1">
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

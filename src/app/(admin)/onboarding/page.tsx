'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface OnboardingStep {
  stepNumber: number;
  key: string;
  name: string;
  nameAr: string;
  description: string;
  isRequired: boolean;
  isComplete: boolean;
  canSkip: boolean;
  validationErrors: string[];
}

interface OnboardingStatus {
  setupMode: 'none' | 'quick' | 'detailed';
  currentStep: number;
  totalSteps: number;
  completionPercentage: number;
  isCompleted: boolean;
  minimumMet: boolean;
  steps: OnboardingStep[];
  validation: {
    hasCompanyProfile: boolean;
    hasServiceType: boolean;
    hasArea: boolean;
    hasZone: boolean;
    hasEmployee: boolean;
    allRequirementsMet: boolean;
    missingItems: string[];
  };
}

// Icons
const Icons = {
  check: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  chevronRight: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  chevronLeft: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  lightning: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  clipboard: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  building: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  mapPin: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  wrench: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  users: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  sitemap: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  ),
  cog: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  mail: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  clipboardCheck: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  exclamation: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
};

const STEP_ICONS: Record<string, JSX.Element> = {
  company: Icons.building,
  'service-location': Icons.mapPin,
  locations: Icons.mapPin,
  services: Icons.wrench,
  employee: Icons.users,
  team: Icons.users,
  organization: Icons.sitemap,
  settings: Icons.cog,
  communication: Icons.mail,
  review: Icons.clipboardCheck,
};

// API_BASE should NOT include /api/v1 since we add it in fetch calls
const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1$/, '') || 'http://localhost:4001';

export default function OnboardingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE}/api/v1/onboarding/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setStatus(data.data);
        // If onboarding is complete, redirect to dashboard
        if (data.data.isCompleted) {
          router.push('/dashboard');
        }
      } else {
        setError(data.error?.message || 'Failed to load onboarding status');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  }

  async function selectMode(mode: 'quick' | 'detailed') {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE}/api/v1/onboarding/mode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mode }),
      });
      const data = await response.json();
      if (data.success) {
        setStatus(data.data);
      } else {
        setError(data.error?.message || 'Failed to select mode');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsSaving(false);
    }
  }

  async function saveStep(stepNum: number) {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE}/api/v1/onboarding/step/${stepNum}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data: {} }),
      });
      const data = await response.json();
      if (data.success) {
        setStatus(data.data);
      } else {
        setError(data.error?.message || 'Failed to save step');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsSaving(false);
    }
  }

  async function skipStep(stepNum: number) {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE}/api/v1/onboarding/step/${stepNum}/skip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setStatus(data.data);
      } else {
        setError(data.error?.message || 'Cannot skip this step');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsSaving(false);
    }
  }

  async function completeOnboarding() {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE}/api/v1/onboarding/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        router.push('/dashboard');
      } else {
        setError(data.error?.message || 'Cannot complete onboarding yet');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsSaving(false);
    }
  }

  function getStepLink(step: OnboardingStep): string {
    const links: Record<string, string> = {
      company: '/settings/company',
      'service-location': '/reference/areas',
      locations: '/reference/areas',
      services: '/reference/complaint-types',
      organization: '/reference/departments',
      employee: '/employees',
      team: '/employees',
      settings: '/settings/business',
      communication: '/settings/email',
      review: '/onboarding',
    };
    return links[step.key] || '/settings';
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500"></div>
          <span className="text-dark-400 text-sm">Loading setup wizard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-2">{Icons.exclamation}</div>
          <p className="text-dark-600 dark:text-dark-400">{error}</p>
          <button
            onClick={() => { setError(null); fetchStatus(); }}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Mode selection screen
  if (status?.setupMode === 'none') {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-dark-800 dark:text-white mb-3">
            Welcome to AgentCare Setup
          </h1>
          <p className="text-dark-500 dark:text-dark-400 text-lg">
            Choose how you would like to configure your account
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Quick Setup */}
          <button
            onClick={() => selectMode('quick')}
            disabled={isSaving}
            className="group relative p-8 bg-white dark:bg-dark-800 rounded-2xl border-2 border-dark-200 dark:border-dark-700 hover:border-primary-500 dark:hover:border-primary-500 transition-all text-left"
          >
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium rounded-full">
                Recommended
              </span>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center text-white mb-6">
              {Icons.lightning}
            </div>
            <h2 className="text-xl font-bold text-dark-800 dark:text-white mb-2">
              Quick Setup
            </h2>
            <p className="text-dark-500 dark:text-dark-400 mb-4">
              Get started in under 5 minutes with essential configuration only.
            </p>
            <ul className="space-y-2 text-sm text-dark-600 dark:text-dark-400">
              <li className="flex items-center gap-2">
                <span className="text-primary-500">{Icons.check}</span>
                Company basics
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary-500">{Icons.check}</span>
                1 service type, 1 area, 1 zone
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary-500">{Icons.check}</span>
                1 employee with access
              </li>
            </ul>
            <div className="mt-6 flex items-center text-primary-500 font-medium group-hover:translate-x-1 transition-transform">
              Start Quick Setup {Icons.chevronRight}
            </div>
          </button>

          {/* Detailed Setup */}
          <button
            onClick={() => selectMode('detailed')}
            disabled={isSaving}
            className="group relative p-8 bg-white dark:bg-dark-800 rounded-2xl border-2 border-dark-200 dark:border-dark-700 hover:border-primary-500 dark:hover:border-primary-500 transition-all text-left"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-accent-purple to-pink-500 rounded-2xl flex items-center justify-center text-white mb-6">
              {Icons.clipboard}
            </div>
            <h2 className="text-xl font-bold text-dark-800 dark:text-white mb-2">
              Detailed Setup
            </h2>
            <p className="text-dark-500 dark:text-dark-400 mb-4">
              Full configuration for your business with all options.
            </p>
            <ul className="space-y-2 text-sm text-dark-600 dark:text-dark-400">
              <li className="flex items-center gap-2">
                <span className="text-accent-purple">{Icons.check}</span>
                Complete company profile
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent-purple">{Icons.check}</span>
                Full location hierarchy
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent-purple">{Icons.check}</span>
                Organization structure & team
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent-purple">{Icons.check}</span>
                Business settings & email
              </li>
            </ul>
            <div className="mt-6 flex items-center text-accent-purple font-medium group-hover:translate-x-1 transition-transform">
              Start Detailed Setup {Icons.chevronRight}
            </div>
          </button>
        </div>

        <p className="text-center text-sm text-dark-400 dark:text-dark-500 mt-8">
          You can always add more details later from Settings
        </p>
      </div>
    );
  }

  // Wizard view
  const currentStep = status?.steps.find(s => s.stepNumber === status.currentStep);

  return (
    <div className="max-w-5xl mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-dark-800 dark:text-white">
            {status?.setupMode === 'quick' ? 'Quick Setup' : 'Detailed Setup'}
          </h1>
          <p className="text-dark-500 dark:text-dark-400 mt-1">
            Step {status?.currentStep} of {status?.totalSteps}
          </p>
        </div>
        <Link
          href="/dashboard"
          className="px-4 py-2 text-dark-500 hover:text-dark-700 dark:text-dark-400 dark:hover:text-dark-200"
        >
          Save & Exit
        </Link>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-dark-500 dark:text-dark-400">Progress</span>
          <span className="font-medium text-dark-700 dark:text-dark-300">
            {status?.completionPercentage}%
          </span>
        </div>
        <div className="h-2 bg-dark-100 dark:bg-dark-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-accent-purple transition-all duration-500"
            style={{ width: `${status?.completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {status?.steps.map((step, index) => (
          <div
            key={step.key}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg flex-shrink-0 ${
              step.isComplete
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                : step.stepNumber === status.currentStep
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 ring-2 ring-primary-500'
                : 'bg-dark-100 dark:bg-dark-700 text-dark-500 dark:text-dark-400'
            }`}
          >
            <span className="w-6 h-6 flex items-center justify-center">
              {step.isComplete ? Icons.check : STEP_ICONS[step.key] || step.stepNumber}
            </span>
            <span className="text-sm font-medium hidden sm:inline">{step.name}</span>
          </div>
        ))}
      </div>

      {/* Current Step Card */}
      {currentStep && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-soft dark:shadow-none dark:border dark:border-dark-700 p-8 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400">
              {STEP_ICONS[currentStep.key]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-dark-800 dark:text-white">
                {currentStep.name}
              </h2>
              <p className="text-dark-500 dark:text-dark-400 mt-1">
                {currentStep.description}
              </p>
            </div>
          </div>

          {/* Validation Errors */}
          {currentStep.validationErrors.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
              <h3 className="font-medium text-amber-800 dark:text-amber-400 mb-2">
                Required before continuing:
              </h3>
              <ul className="space-y-1">
                {currentStep.validationErrors.map((err, i) => (
                  <li key={i} className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                    <span className="text-amber-500">{Icons.exclamation}</span>
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Step Action */}
          {currentStep.key !== 'review' ? (
            <div className="flex items-center gap-4">
              <Link
                href={getStepLink(currentStep)}
                className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
              >
                Configure {currentStep.name}
              </Link>
              <span className="text-dark-400 dark:text-dark-500 text-sm">
                Complete the setup in Settings, then return here to continue
              </span>
            </div>
          ) : (
            <div>
              {/* Review Step - Show validation summary */}
              <div className="grid gap-4 mb-6">
                {Object.entries({
                  'Company Profile': status?.validation.hasCompanyProfile,
                  'Service Type': status?.validation.hasServiceType,
                  'Area': status?.validation.hasArea,
                  'Zone': status?.validation.hasZone,
                  'Employee': status?.validation.hasEmployee,
                }).map(([label, isComplete]) => (
                  <div
                    key={label}
                    className={`flex items-center justify-between p-4 rounded-xl ${
                      isComplete
                        ? 'bg-emerald-50 dark:bg-emerald-900/20'
                        : 'bg-red-50 dark:bg-red-900/20'
                    }`}
                  >
                    <span className="font-medium text-dark-700 dark:text-dark-300">{label}</span>
                    <span className={isComplete ? 'text-emerald-500' : 'text-red-500'}>
                      {isComplete ? Icons.check : Icons.exclamation}
                    </span>
                  </div>
                ))}
              </div>

              {status?.validation.allRequirementsMet ? (
                <button
                  onClick={completeOnboarding}
                  disabled={isSaving}
                  className="w-full px-6 py-4 bg-gradient-to-r from-primary-500 to-accent-purple hover:from-primary-600 hover:to-pink-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Completing...' : 'Complete Setup & Go to Dashboard'}
                </button>
              ) : (
                <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                  <p className="text-amber-700 dark:text-amber-400">
                    Please complete all required steps before finishing setup.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => status && status.currentStep > 1 && setStatus({
            ...status,
            currentStep: status.currentStep - 1
          })}
          disabled={!status || status.currentStep <= 1}
          className="flex items-center gap-2 px-4 py-2 text-dark-500 hover:text-dark-700 dark:text-dark-400 dark:hover:text-dark-200 disabled:opacity-50"
        >
          {Icons.chevronLeft} Previous
        </button>

        <div className="flex items-center gap-3">
          {currentStep?.canSkip && (
            <button
              onClick={() => currentStep && skipStep(currentStep.stepNumber)}
              disabled={isSaving}
              className="px-4 py-2 text-dark-500 hover:text-dark-700 dark:text-dark-400 dark:hover:text-dark-200"
            >
              Skip
            </button>
          )}
          {currentStep?.key !== 'review' && (
            <button
              onClick={() => currentStep && saveStep(currentStep.stepNumber)}
              disabled={isSaving || (currentStep?.validationErrors.length || 0) > 0}
              className="flex items-center gap-2 px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Mark Complete & Continue'} {Icons.chevronRight}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function OnboardingBanner() {
  const { onboardingStatus, user } = useAuth();

  // Don't show banner if:
  // - No onboarding status
  // - Onboarding is complete
  // - User is not admin (technicians etc don't need to see this)
  if (
    !onboardingStatus ||
    onboardingStatus.isCompleted ||
    user?.role?.name !== 'admin'
  ) {
    return null;
  }

  const { completionPercentage, currentStep, totalSteps, setupMode } = onboardingStatus;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-500 via-primary-600 to-accent-purple p-6 mb-6 text-white shadow-glow">
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">Complete Your Setup</h3>
            <p className="text-primary-100 mt-1">
              {setupMode === 'none'
                ? 'Get started by choosing your setup mode'
                : `Continue your ${setupMode} setup to unlock all features`}
            </p>

            {setupMode !== 'none' && (
              <div className="flex items-center gap-4 mt-4">
                <div className="flex-1 max-w-xs">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{completionPercentage}%</span>
                  </div>
                  <div className="h-2 bg-primary-400/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-500"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm text-primary-200">
                  Step {currentStep} of {totalSteps}
                </span>
              </div>
            )}
          </div>

          <Link
            href="/onboarding"
            className="px-6 py-3 bg-white text-primary-600 rounded-xl font-medium hover:bg-primary-50 transition-colors shadow-lg"
          >
            {setupMode === 'none' ? 'Start Setup' : 'Continue Setup'}
          </Link>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
      <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
    </div>
  );
}

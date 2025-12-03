import { useState, useRef, useEffect } from 'react';
import { ProfileSetup } from './ProfileSetup';
import { ExperienceLevel } from './ExperienceLevel';
import { RoutineCreation } from './RoutineCreation';
import { GetStarted } from './GetStarted';
import { Card } from '../ui/Card';

const STEPS = ['profile', 'experience', 'routine', 'start'];

/**
 * Onboarding Flow - Full onboarding experience with smooth animations
 * 1. Profile Setup (name, DOB, optional metrics)
 * 2. Experience Level (beginner/intermediate/professional)
 * 3. Routine Creation (templates or AI-generated)
 * 4. Get Started (slide to begin)
 */
export function OnboardingFlow({ 
  userPhoto, 
  userName, 
  onComplete,
  existingApiKey 
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const [isAnimating, setIsAnimating] = useState(false);
  const [data, setData] = useState({
    profile: null,
    experienceLevel: null,
    routine: null,
    apiKey: existingApiKey || null
  });

  const goToStep = (stepIndex, newDirection = 1) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setDirection(newDirection);
    
    // Wait for exit animation
    setTimeout(() => {
      setCurrentStep(stepIndex);
      setIsAnimating(false);
    }, 300);
  };

  const handleProfileComplete = (profileData) => {
    setData(prev => ({ ...prev, profile: profileData }));
    goToStep(1);
  };

  const handleExperienceComplete = (level) => {
    setData(prev => ({ ...prev, experienceLevel: level }));
    goToStep(2);
  };

  const handleRoutineComplete = (routineData) => {
    setData(prev => ({ 
      ...prev, 
      routine: routineData,
      apiKey: routineData.apiKey || prev.apiKey
    }));
    goToStep(3);
  };

  const handleGetStarted = () => {
    // Compile all data and complete onboarding
    onComplete({
      profile: data.profile,
      experienceLevel: data.experienceLevel,
      workoutPlans: data.routine?.plans || null,
      routineType: data.routine?.type || null,
      templateId: data.routine?.templateId || null,
      apiKey: data.apiKey,
      aiEnabled: !!data.apiKey
    });
  };

  const handleBack = () => {
    if (currentStep > 0) {
      goToStep(currentStep - 1, -1);
    }
  };

  // Animation classes based on direction and animating state
  const getAnimationClass = () => {
    if (isAnimating) {
      return direction === 1 
        ? 'opacity-0 translate-x-8' 
        : 'opacity-0 -translate-x-8';
    }
    return 'opacity-100 translate-x-0';
  };

  const renderStep = () => {
    switch (STEPS[currentStep]) {
      case 'profile':
        return (
          <ProfileSetup
            userPhoto={userPhoto}
            userName={userName}
            onComplete={handleProfileComplete}
          />
        );
      case 'experience':
        return (
          <ExperienceLevel
            initialValue={data.experienceLevel}
            onComplete={handleExperienceComplete}
          />
        );
      case 'routine':
        return (
          <RoutineCreation
            experienceLevel={data.experienceLevel}
            apiKey={data.apiKey}
            onComplete={handleRoutineComplete}
            onBack={handleBack}
          />
        );
      case 'start':
        return (
          <GetStarted
            userName={data.profile?.display_name || userName || 'Champion'}
            onComplete={handleGetStarted}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-950">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950" />
      
      {/* Subtle animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Progress indicators */}
      <div className="absolute top-8 left-0 right-0 flex justify-center gap-2 safe-area-top">
        {STEPS.map((step, idx) => (
          <div
            key={step}
            className={`h-1 rounded-full transition-all duration-500 ${
              idx < currentStep 
                ? 'w-8 bg-emerald-500' 
                : idx === currentStep 
                  ? 'w-8 bg-emerald-500/50' 
                  : 'w-4 bg-gray-700'
            }`}
          />
        ))}
      </div>

      {/* Step counter */}
      <div className="absolute top-14 left-0 right-0 text-center safe-area-top">
        <span className="text-xs text-gray-600 font-medium">
          Step {currentStep + 1} of {STEPS.length}
        </span>
      </div>

      {/* Main content */}
      <Card hover={false} className="relative max-w-md w-full p-6 max-h-[85vh] overflow-y-auto scrollbar-hide">
        <div 
          className={`transition-all duration-300 ease-out ${getAnimationClass()}`}
        >
          {renderStep()}
        </div>
      </Card>
    </div>
  );
}

// Export individual components for use elsewhere
export { ProfileSetup } from './ProfileSetup';
export { ExperienceLevel, EXPERIENCE_LEVELS } from './ExperienceLevel';
export { RoutineCreation, WORKOUT_TEMPLATES } from './RoutineCreation';
export { GetStarted } from './GetStarted';

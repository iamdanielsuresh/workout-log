import { useState } from 'react';
import { Dumbbell, Trophy, Target, ChevronRight, Check } from 'lucide-react';
import { Button } from '../ui/Button';

const EXPERIENCE_LEVELS = [
  {
    id: 'beginner',
    label: 'Beginner',
    description: 'New to gym or less than 6 months',
    icon: Target,
    color: 'emerald',
    features: ['Learn proper form', 'Build foundation', 'Full body workouts'],
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    description: '6 months to 2 years of training',
    icon: Dumbbell,
    color: 'blue',
    features: ['Progressive overload', 'Split routines', 'Track PRs'],
  },
  {
    id: 'professional',
    label: 'Professional',
    description: 'Advanced lifter, 2+ years',
    icon: Trophy,
    color: 'amber',
    features: ['Periodization', 'Advanced techniques', 'Competition prep'],
  },
];

/**
 * Experience Level Selection - Step 1 of onboarding flow
 */
export function ExperienceLevel({ onComplete, initialValue }) {
  const [selected, setSelected] = useState(initialValue || null);

  const handleContinue = () => {
    if (selected) {
      onComplete(selected);
    }
  };

  const getColorClasses = (level, isSelected) => {
    const colors = {
      emerald: {
        bg: isSelected ? 'bg-emerald-500/10' : 'bg-gray-800/50',
        border: isSelected ? 'border-emerald-500' : 'border-gray-700',
        icon: isSelected ? 'text-emerald-400' : 'text-gray-500',
        text: isSelected ? 'text-emerald-400' : 'text-gray-500',
      },
      blue: {
        bg: isSelected ? 'bg-blue-500/10' : 'bg-gray-800/50',
        border: isSelected ? 'border-blue-500' : 'border-gray-700',
        icon: isSelected ? 'text-blue-400' : 'text-gray-500',
        text: isSelected ? 'text-blue-400' : 'text-gray-500',
      },
      amber: {
        bg: isSelected ? 'bg-amber-500/10' : 'bg-gray-800/50',
        border: isSelected ? 'border-amber-500' : 'border-gray-700',
        icon: isSelected ? 'text-amber-400' : 'text-gray-500',
        text: isSelected ? 'text-amber-400' : 'text-gray-500',
      },
    };
    return colors[level.color];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-display font-bold text-gray-100 mb-2 tracking-tight">What's Your Experience?</h2>
        <p className="text-gray-500 text-sm">This helps us personalize your workouts</p>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {EXPERIENCE_LEVELS.map((level) => {
          const isSelected = selected === level.id;
          const colors = getColorClasses(level, isSelected);
          const Icon = level.icon;

          return (
            <button
              key={level.id}
              onClick={() => setSelected(level.id)}
              className={`w-full p-4 rounded-2xl border-2 ${colors.bg} ${colors.border} transition-all duration-300 ${
                isSelected ? 'scale-[1.02] shadow-lg' : 'hover:border-gray-600'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${isSelected ? colors.bg : 'bg-gray-800'} transition-colors`}>
                  <Icon className={`w-6 h-6 ${colors.icon} transition-colors`} />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-display font-bold text-lg ${isSelected ? 'text-gray-100' : 'text-gray-300'} transition-colors tracking-tight`}>
                      {level.label}
                    </h3>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-gray-950" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{level.description}</p>
                  {isSelected && (
                    <div className="mt-3 flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2">
                      {level.features.map((feature, idx) => (
                        <span
                          key={idx}
                          className={`text-xs px-2 py-1 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Continue Button */}
      <Button
        onClick={handleContinue}
        disabled={!selected}
        size="xl"
        className="w-full"
        icon={ChevronRight}
      >
        Continue
      </Button>
    </div>
  );
}

export { EXPERIENCE_LEVELS };

import React from 'react';
import { 
  Calendar, Target, Clock, Dumbbell, AlertCircle, 
  Scale, ArrowUp, ArrowDown, Zap, Activity,
  Building2, User, Plus, Minus
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

export function AiPreferencesForm({ questions, setQuestions, disabled = false }) {
  const updateQuestion = (key, value) => {
    setQuestions(prev => ({ ...prev, [key]: value }));
  };

  const GOAL_OPTIONS = [
    { id: 'strength', label: 'Strength', icon: Dumbbell, desc: 'Low reps, heavy weight' },
    { id: 'hypertrophy', label: 'Muscle Size', icon: Zap, desc: 'Moderate reps, volume' },
    { id: 'balanced', label: 'Balanced', icon: Scale, desc: 'Mix of strength & size' },
    { id: 'athletic', label: 'Athletic', icon: Activity, desc: 'Performance & conditioning' }
  ];

  const TARGET_OPTIONS = [
    { id: 'full_body', label: 'Full Body', icon: User, desc: 'Hit everything each session' },
    { id: 'upper_lower', label: 'Upper/Lower', icon: ArrowUp, desc: 'Split by body part' },
    { id: 'ppl', label: 'Push/Pull/Legs', icon: Activity, desc: 'Classic 3-day split' },
    { id: 'bro_split', label: 'Body Part Split', icon: Target, desc: 'Focus on 1-2 parts/day' }
  ];

  const DURATION_OPTIONS = [
    { id: '30-45', label: '30-45 min', desc: 'Quick & intense' },
    { id: '45-60', label: '45-60 min', desc: 'Standard session' },
    { id: '60-90', label: '60-90 min', desc: 'High volume' }
  ];

  const EQUIPMENT_OPTIONS = [
    { id: 'full', label: 'Full Gym', icon: Building2, desc: 'Barbells, machines, cables' },
    { id: 'dumbbells', label: 'Dumbbells Only', icon: Dumbbell, desc: 'Home gym basics' },
    { id: 'bodyweight', label: 'Bodyweight', icon: User, desc: 'No equipment needed' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Days Per Week */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-gray-200 font-display font-bold tracking-tight">
          <div className="p-1.5 bg-emerald-500/10 rounded-lg">
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <h3>Days per week</h3>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {[3, 4, 5, 6, 7].map((days) => (
            <button
              key={days}
              onClick={() => updateQuestion('daysPerWeek', days)}
              disabled={disabled}
              className={`
                relative group overflow-hidden p-3 rounded-xl border transition-all duration-300
                ${questions.daysPerWeek === days 
                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/25 scale-105' 
                  : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600 hover:bg-gray-800'
                }
              `}
            >
              <span className="relative z-10 text-lg font-bold">{days}</span>
              {questions.daysPerWeek === days && (
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Training Goal */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-gray-200 font-display font-bold tracking-tight">
          <div className="p-1.5 bg-blue-500/10 rounded-lg">
            <Target className="w-4 h-4 text-blue-400" />
          </div>
          <h3>Primary Goal</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {GOAL_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = questions.goal === option.id;
            return (
              <button
                key={option.id}
                onClick={() => updateQuestion('goal', option.id)}
                disabled={disabled}
                className={`
                  relative p-3 rounded-xl border text-left transition-all duration-300
                  ${isSelected 
                    ? 'bg-blue-500/10 border-blue-500/50 shadow-lg shadow-blue-500/10' 
                    : 'bg-gray-800/50 border-gray-700 hover:border-gray-600 hover:bg-gray-800'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    p-2 rounded-lg transition-colors
                    ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-700/50 text-gray-400'}
                  `}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className={`font-bold text-sm ${isSelected ? 'text-blue-400' : 'text-gray-300'}`}>
                      {option.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 leading-tight">
                      {option.desc}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Target Split */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-gray-200 font-display font-bold tracking-tight">
          <div className="p-1.5 bg-purple-500/10 rounded-lg">
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <h3>Target Split</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {TARGET_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = questions.target === option.id;
            return (
              <button
                key={option.id}
                onClick={() => updateQuestion('target', option.id)}
                disabled={disabled}
                className={`
                  relative p-3 rounded-xl border text-left transition-all duration-300
                  ${isSelected 
                    ? 'bg-purple-500/10 border-purple-500/50 shadow-lg shadow-purple-500/10' 
                    : 'bg-gray-800/50 border-gray-700 hover:border-gray-600 hover:bg-gray-800'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    p-2 rounded-lg transition-colors
                    ${isSelected ? 'bg-purple-500 text-white' : 'bg-gray-700/50 text-gray-400'}
                  `}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className={`font-bold text-sm ${isSelected ? 'text-purple-400' : 'text-gray-300'}`}>
                      {option.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 leading-tight">
                      {option.desc}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Optional: Exercises to Include/Exclude */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-gray-200 font-display font-bold tracking-tight">
          <div className="p-1.5 bg-emerald-500/10 rounded-lg">
            <Plus className="w-4 h-4 text-emerald-400" />
          </div>
          <h3>Preferences (Optional)</h3>
        </div>
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Exercises to Include</label>
            <Input
              value={questions.includeExercises || ''}
              onChange={(e) => updateQuestion('includeExercises', e.target.value)}
              placeholder="e.g., Squats, Bench Press"
              icon={Plus}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Exercises to Exclude</label>
            <Input
              value={questions.excludeExercises || ''}
              onChange={(e) => updateQuestion('excludeExercises', e.target.value)}
              placeholder="e.g., Burpees, Box Jumps"
              icon={Minus}
            />
          </div>
        </div>
      </section>

      {/* Duration & Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Duration */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-gray-200 font-display font-bold tracking-tight">
            <div className="p-1.5 bg-orange-500/10 rounded-lg">
              <Clock className="w-4 h-4 text-orange-400" />
            </div>
            <h3>Duration</h3>
          </div>

          <div className="space-y-2">
            {DURATION_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => updateQuestion('duration', option.id)}
                disabled={disabled}
                className={`
                  w-full p-3 rounded-xl border text-left transition-all duration-200 flex items-center justify-between
                  ${questions.duration === option.id
                    ? 'bg-orange-500/10 border-orange-500/50 text-orange-400'
                    : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-800'
                  }
                `}
              >
                <span className="font-medium text-sm">{option.label}</span>
                <span className="text-xs opacity-70">{option.desc}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Equipment */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-gray-200 font-display font-bold tracking-tight">
            <div className="p-1.5 bg-purple-500/10 rounded-lg">
              <Dumbbell className="w-4 h-4 text-purple-400" />
            </div>
            <h3>Equipment</h3>
          </div>

          <div className="space-y-2">
            {EQUIPMENT_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => updateQuestion('equipment', option.id)}
                  disabled={disabled}
                  className={`
                    w-full p-3 rounded-xl border text-left transition-all duration-200 flex items-center gap-3
                    ${questions.equipment === option.id
                      ? 'bg-purple-500/10 border-purple-500/50 text-purple-400'
                      : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-800'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs opacity-70">{option.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Special Notes */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-gray-200 font-display font-bold tracking-tight">
          <div className="p-1.5 bg-red-500/10 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
          <h3>Additional Notes</h3>
        </div>

        <div className="relative">
          <textarea
            value={questions.specialNotes}
            onChange={(e) => updateQuestion('specialNotes', e.target.value)}
            onFocus={(e) => {
              // Scroll textarea into view when focused on mobile
              setTimeout(() => {
                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 300);
            }}
            disabled={disabled}
            placeholder="E.g., I have a shoulder injury, avoid overhead pressing. I want to focus on my glutes."
            className="w-full min-h-[100px] p-4 rounded-xl bg-gray-800/50 border border-gray-700 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none text-sm"
          />
          <div className="absolute bottom-3 right-3 text-xs text-gray-600">
            Optional
          </div>
        </div>
      </section>

    </div>
  );
}

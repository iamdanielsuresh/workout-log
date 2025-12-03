import { Clock, ChevronRight, Dumbbell, Flame, Target } from 'lucide-react';
import { Card } from '../ui/Card';

/**
 * Workout card for displaying workout options
 */
export function WorkoutCard({ 
  workout, 
  onClick, 
  recommended = false,
  recommendationLabel = '',
  compact = false 
}) {
  const exerciseCount = workout.exercises?.length || 0;
  const estTime = workout.estTime || '~45 min';

  if (compact) {
    return (
      <Card onClick={onClick} className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-gray-800 rounded-xl">
              <Dumbbell className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-100">{workout.name}</h4>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Target className="w-3 h-3" />
                  {exerciseCount} exercises
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  {estTime}
                </span>
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </div>
      </Card>
    );
  }

  return (
    <div className="relative group">
      {recommended && (
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity" />
      )}
      <Card onClick={onClick} className="p-5 relative">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col gap-1">
            {recommended && (
              <span className="bg-emerald-500/20 text-emerald-400 text-2xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider w-fit">
                Recommended
              </span>
            )}
            {recommendationLabel && (
              <span className="text-xs text-gray-500 pl-0.5">
                {recommendationLabel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-gray-500 text-xs">
            <Target className="w-3.5 h-3.5" />
            <span>{exerciseCount} exercises</span>
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-100 mb-1">{workout.name}</h2>
        {workout.desc && (
          <p className="text-gray-500 text-sm mb-4">{workout.desc}</p>
        )}

        <div className="flex items-center justify-between text-sm font-medium bg-gray-800/50 p-3 rounded-xl border border-gray-700">
          <div className="flex items-center gap-2 text-gray-400">
            <Clock className="w-4 h-4 text-emerald-500" />
            <span>{estTime}</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400 font-semibold">
            Start <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </Card>
    </div>
  );
}

/**
 * Streak card component
 */
export function StreakCard({ streak }) {
  if (streak <= 0) return null;

  return (
    <Card hover={false} className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 rounded-xl">
            <Flame className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Current Streak</p>
            <p className="text-xl font-bold text-gray-100">
              {streak} day{streak !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <span className="text-3xl">🔥</span>
      </div>
    </Card>
  );
}

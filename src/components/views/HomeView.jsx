import { User, History, Flame, Sparkles, Dumbbell, Settings } from 'lucide-react';
import { Card } from '../ui/Card';
import { WorkoutCard, StreakCard } from '../workout/WorkoutCard';

/**
 * HomeView - Main dashboard showing user info, recommended workout, and stats
 */
export function HomeView({ 
  userName, userPhoto, isAnonymous, streak, workouts, plans,
  suggestedWorkout, nextWorkoutKey, lastWorkout, aiEnabled,
  recommendationLabel, nextActionHint,
  onSelectWorkout, onViewHistory, onSettings
}) {
  const isFirstTime = workouts.length === 0;

  // Helper to get hint styling based on type
  const getHintStyle = (type) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      case 'motivation':
        return 'bg-orange-500/10 border-orange-500/20 text-orange-400';
      default:
        return 'bg-gray-800/50 border-gray-700 text-gray-400';
    }
  };

  return (
    <div className="p-6 pb-nav max-w-lg mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 safe-area-top">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {userPhoto ? (
            <img src={userPhoto} alt="Profile" className="w-12 h-12 rounded-full border-2 border-gray-800" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
              <User className="w-6 h-6 text-gray-500" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-100 tracking-tight">
              {isFirstTime ? `Welcome${userName !== 'there' ? `, ${userName}` : ''}! 👋` : `Hi ${userName}`}
            </h1>
            <p className="text-gray-500 text-xs">
              {isAnonymous ? 'Guest Mode' : (lastWorkout ? `Last: ${lastWorkout.workoutName}` : "Let's start your journey")}
            </p>
          </div>
        </div>
        <button 
          onClick={onSettings}
          className="p-2 bg-gray-800/50 hover:bg-gray-800 rounded-full transition-colors border border-gray-700"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Next Action Hint */}
      {nextActionHint && (
        <div className={`px-4 py-3 rounded-xl border text-sm font-medium ${getHintStyle(nextActionHint.type)}`}>
          {nextActionHint.message}
        </div>
      )}

      {/* Streak Card */}
      {streak > 0 && <StreakCard streak={streak} />}

      {/* Main Workout Card - Now uses slide modal */}
      {suggestedWorkout ? (
        <WorkoutCard 
          workout={suggestedWorkout} 
          onClick={() => onSelectWorkout(nextWorkoutKey)} 
          recommended
          recommendationLabel={recommendationLabel}
        />
      ) : Object.keys(plans).length === 0 && (
        <Card hover={false} className="p-6 text-center">
          <div className="w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-7 h-7 text-gray-600" />
          </div>
          <h3 className="font-semibold text-gray-300 mb-2">No workout plans yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Create your first routine to start tracking workouts
          </p>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card onClick={onViewHistory} className="p-4 flex flex-col items-center gap-2">
          <History className="w-6 h-6 text-emerald-400" />
          <span className="text-2xl font-display font-bold text-gray-200">{workouts.length}</span>
          <span className="text-xs text-gray-500">Total Workouts</span>
        </Card>
        <Card className="p-4 flex flex-col items-center gap-2">
          <Flame className="w-6 h-6 text-amber-400" />
          <span className="text-2xl font-display font-bold text-gray-200">{streak}</span>
          <span className="text-xs text-gray-500">Day Streak</span>
        </Card>
      </div>

      {/* Other Workouts - Now all use slide modal */}
      {Object.values(plans).filter(plan => plan.id !== nextWorkoutKey).length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-4 px-1">
            Other Routines
          </h3>
          <div className="space-y-3">
            {Object.values(plans)
              .filter(plan => plan.id !== nextWorkoutKey)
              .map(plan => (
                <WorkoutCard 
                  key={plan.id} 
                  workout={plan} 
                  onClick={() => onSelectWorkout(plan.id)} 
                  compact 
                />
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}

export default HomeView;

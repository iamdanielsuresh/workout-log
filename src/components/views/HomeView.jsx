import { 
  User, History, Flame, Sparkles, Dumbbell, Settings, 
  Calendar, ChevronRight, Play, Plus, BarChart3, Zap,
  Clock, Target
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { WorkoutCard } from '../workout/WorkoutCard';

/**
 * HomeView - Main dashboard showing user info, recommended workout, and stats
 */
export function HomeView({ 
  userName, userPhoto, isAnonymous, streak, workouts, plans,
  suggestedWorkout, nextWorkoutKey, lastWorkout, aiEnabled,
  recommendationLabel, nextActionHint,
  onSelectWorkout, onViewHistory, onSettings, onQuickLog, onBuddy
}) {
  const isFirstTime = workouts.length === 0;

  // 1. Greeting Logic
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // 2. Weekly Calendar Logic
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // Monday start
  
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const isWorkoutDay = (date) => {
    return workouts.some(w => {
      const wDate = new Date(w.timestamp);
      return wDate.getDate() === date.getDate() && 
             wDate.getMonth() === date.getMonth() && 
             wDate.getFullYear() === date.getFullYear();
    });
  };

  const isToday = (date) => {
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  return (
    <div className="p-6 pb-nav max-w-lg mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 safe-area-top">
      
      {/* 1. Dynamic Hero Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          {userPhoto ? (
            <img src={userPhoto} alt="Profile" className="w-12 h-12 rounded-full border-2 border-gray-800" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
              <User className="w-6 h-6 text-gray-500" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-100 tracking-tight">
              {greeting}, {userName.split(' ')[0]}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {streak > 0 && (
                <span className="text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Flame className="w-3 h-3" /> {streak} day streak
                </span>
              )}
              {isAnonymous && (
                <span className="text-xs text-gray-500">Guest Mode</span>
              )}
            </div>
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

      {/* 2. Weekly Consistency Tracker */}
      <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-800">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">This Week</h3>
          <span className="text-xs text-gray-600">{today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
        </div>
        <div className="flex justify-between">
          {weekDays.map((date, i) => {
            const hasWorkout = isWorkoutDay(date);
            const isCurrentDay = isToday(date);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'narrow' });
            
            return (
              <div key={i} className="flex flex-col items-center gap-2">
                <span className={`text-xs font-medium ${isCurrentDay ? 'text-emerald-400' : 'text-gray-500'}`}>
                  {dayName}
                </span>
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${hasWorkout 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                    : isCurrentDay 
                      ? 'bg-gray-800 border-2 border-emerald-500/50 text-gray-300' 
                      : 'bg-gray-800/50 text-gray-600'
                  }
                `}>
                  {hasWorkout ? <Zap className="w-4 h-4 fill-current" /> : date.getDate()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. "Up Next" Feature Card */}
      <div>
        <h3 className="text-lg font-display font-bold text-gray-100 mb-3 flex items-center gap-2">
          Up Next
          {recommendationLabel && (
            <span className="text-xs font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              {recommendationLabel}
            </span>
          )}
        </h3>
        
        {suggestedWorkout ? (
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
            <button 
              onClick={() => onSelectWorkout(nextWorkoutKey)}
              className="relative w-full bg-gray-900 rounded-xl p-5 text-left border border-gray-800 hover:border-emerald-500/50 transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">{suggestedWorkout.name}</h2>
                  <p className="text-gray-400 text-sm line-clamp-1">{suggestedWorkout.description || 'Ready to crush it?'}</p>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-xl">
                  <Dumbbell className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1.5 text-sm text-gray-400">
                  <Clock className="w-4 h-4 text-gray-500" />
                  {suggestedWorkout.estTime || '45 min'}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-400">
                  <Target className="w-4 h-4 text-gray-500" />
                  {suggestedWorkout.exercises?.length || 0} Exercises
                </div>
              </div>

              <div className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-bold text-center transition-colors flex items-center justify-center gap-2">
                <Play className="w-4 h-4 fill-current" />
                Start Workout
              </div>
            </button>
          </div>
        ) : (
          <Card hover={false} className="p-8 text-center border-dashed border-2 border-gray-800 bg-transparent">
            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <Plus className="w-6 h-6 text-gray-500" />
            </div>
            <h3 className="font-semibold text-gray-300 mb-1">No active plan</h3>
            <p className="text-sm text-gray-500 mb-4">Create a routine to get started</p>
            <Button onClick={() => onSelectWorkout('create')} size="sm" variant="secondary">
              Create Routine
            </Button>
          </Card>
        )}
      </div>

      {/* 4. Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={onQuickLog}
          className="p-4 bg-gray-800/50 hover:bg-gray-800 rounded-xl border border-gray-700/50 transition-all text-left group"
        >
          <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Plus className="w-5 h-5 text-blue-400" />
          </div>
          <h4 className="font-bold text-gray-200">Quick Log</h4>
          <p className="text-xs text-gray-500 mt-0.5">Log single exercise</p>
        </button>

        <button 
          onClick={onViewHistory}
          className="p-4 bg-gray-800/50 hover:bg-gray-800 rounded-xl border border-gray-700/50 transition-all text-left group"
        >
          <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <History className="w-5 h-5 text-purple-400" />
          </div>
          <h4 className="font-bold text-gray-200">History</h4>
          <p className="text-xs text-gray-500 mt-0.5">View past sessions</p>
        </button>

        <button 
          onClick={onBuddy}
          className="p-4 bg-gray-800/50 hover:bg-gray-800 rounded-xl border border-gray-700/50 transition-all text-left group"
        >
          <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <h4 className="font-bold text-gray-200">AI Coach</h4>
          <p className="text-xs text-gray-500 mt-0.5">Ask for tips</p>
        </button>

        <button 
          className="p-4 bg-gray-800/50 hover:bg-gray-800 rounded-xl border border-gray-700/50 transition-all text-left group opacity-50 cursor-not-allowed"
        >
          <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center mb-3">
            <BarChart3 className="w-5 h-5 text-orange-400" />
          </div>
          <h4 className="font-bold text-gray-200">Stats</h4>
          <p className="text-xs text-gray-500 mt-0.5">Coming soon</p>
        </button>
      </div>

      {/* 5. Recent Activity Snippet */}
      {lastWorkout && (
        <div className="bg-gray-900/30 rounded-xl p-4 border border-gray-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-800 rounded-lg">
              <History className="w-4 h-4 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-300">Last Session</p>
              <p className="text-xs text-gray-500">{lastWorkout.workoutName}</p>
            </div>
          </div>
          <span className="text-xs text-gray-600">
            {new Date(lastWorkout.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      )}

      {/* Other Routines List */}
      {Object.values(plans).filter(plan => plan.id !== nextWorkoutKey).length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3 px-1">
            Your Routines
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

import { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Dumbbell, ChevronRight, Clock, Flame, X, 
  ChevronLeft, Zap, Target, AlertCircle 
} from 'lucide-react';
import { Card } from '../ui/Card';
import { calculatePlanIntensity } from '../../utils/aiWorkoutGenerator';

/**
 * Format last workout date for display
 */
function formatLastWorkout(lastWorkout) {
  if (!lastWorkout?.created_at && !lastWorkout?.timestamp) return null;
  
  const date = new Date(lastWorkout.created_at || lastWorkout.timestamp);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * WorkoutStartModal - Slide to start confirmation before beginning workout
 * Shows workout details and requires slide gesture to start
 */
export function WorkoutStartModal({ 
  isOpen, 
  workout, 
  lastWorkout,
  onStart, 
  onClose 
}) {
  const [slideProgress, setSlideProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const sliderRef = useRef(null);
  const containerRef = useRef(null);

  // Calculate intensity dynamically from workout data
  const intensity = useMemo(() => {
    if (!workout?.exercises || workout.exercises.length === 0) {
      return { level: 'N/A', score: 0 };
    }
    return calculatePlanIntensity(workout);
  }, [workout]);

  // Check if workout can be started
  const canStart = workout?.exercises && workout.exercises.length > 0;
  const noExercisesMessage = !canStart && workout;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSlideProgress(0);
      setIsStarting(false);
    }
  }, [isOpen]);

  const handleStart = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMove = (e) => {
    if (!isDragging || !containerRef.current || !sliderRef.current) return;

    const container = containerRef.current.getBoundingClientRect();
    const slider = sliderRef.current.getBoundingClientRect();
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    
    const maxSlide = container.width - slider.width - 16;
    const currentX = clientX - container.left - slider.width / 2 - 8;
    const progress = Math.max(0, Math.min(1, currentX / maxSlide));
    
    setSlideProgress(progress);

    if (progress >= 0.95) {
      setIsStarting(true);
      setIsDragging(false);
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      // Trigger start after animation
      setTimeout(() => {
        onStart();
      }, 400);
    }
  };

  const handleEnd = () => {
    if (!isStarting) {
      setIsDragging(false);
      setSlideProgress(0);
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, isStarting]);

  if (!isOpen || !workout) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-500"
        onClick={!isStarting ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className={`relative w-full sm:max-w-md mx-auto animate-in slide-in-from-bottom-10 fade-in duration-500 ${
        isStarting ? 'scale-105 opacity-0' : ''
      } transition-all duration-300`}>
        <Card 
          hover={false} 
          className="p-0 overflow-hidden rounded-t-[2.5rem] sm:rounded-[2.5rem] border-t border-gray-700/50 sm:border bg-gray-900/95 backdrop-blur-xl shadow-2xl shadow-black/50"
        >
          {/* Header Image/Icon Area */}
          <div className="relative h-48 bg-gradient-to-br from-emerald-900/40 via-gray-900 to-gray-900 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/95" />
            
            {/* Close button */}
            {!isStarting && (
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full transition-all z-10"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            <div className={`relative z-10 flex flex-col items-center transition-all duration-500 ${isStarting ? 'scale-110' : ''}`}>
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 shadow-2xl shadow-emerald-500/20 ring-1 ring-white/10 backdrop-blur-md ${
                isStarting ? 'bg-emerald-500 text-gray-950' : 'bg-gray-800/50 text-emerald-400'
              }`}>
                {isStarting ? (
                  <Zap className="w-10 h-10 animate-pulse" />
                ) : (
                  <Dumbbell className="w-10 h-10" />
                )}
              </div>
              <h2 className="text-3xl font-display font-bold text-white text-center px-6 leading-tight">
                {isStarting ? 'Let\'s Crush It!' : workout.name}
              </h2>
            </div>
          </div>

          <div className="px-6 pb-8 -mt-4 relative z-20">
            {/* Description */}
            {!isStarting && workout.desc && (
              <p className="text-gray-400 text-center text-sm mb-6 px-4 leading-relaxed">
                {workout.desc}
              </p>
            )}

            {/* Stats Grid */}
            {!isStarting && canStart && (
              <div className="grid grid-cols-3 gap-3 mb-8">
                <div className="flex flex-col items-center justify-center p-3 bg-gray-800/40 rounded-2xl border border-white/5">
                  <Target className="w-5 h-5 text-emerald-400 mb-1.5" />
                  <span className="text-lg font-display font-bold text-white">{workout.exercises?.length || 0}</span>
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Exercises</span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 bg-gray-800/40 rounded-2xl border border-white/5">
                  <Clock className="w-5 h-5 text-blue-400 mb-1.5" />
                  <span className="text-lg font-display font-bold text-white">{workout.estTime || '45m'}</span>
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Duration</span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 bg-gray-800/40 rounded-2xl border border-white/5">
                  <Flame className={`w-5 h-5 mb-1.5 ${
                    intensity.level === 'Low' ? 'text-blue-400' :
                    intensity.level === 'Moderate' ? 'text-emerald-400' :
                    intensity.level === 'High' ? 'text-amber-400' :
                    'text-red-400'
                  }`} />
                  <span className="text-lg font-display font-bold text-white">{intensity.level}</span>
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Intensity</span>
                </div>
              </div>
            )}

            {/* Exercise Preview List */}
            {!isStarting && canStart && workout.exercises && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Workout Plan</h4>
                  <span className="text-xs text-gray-600">{workout.exercises.length} movements</span>
                </div>
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                  {workout.exercises.map((ex, i) => (
                    <div 
                      key={i} 
                      className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-xl border border-white/5 hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="w-6 h-6 rounded-full bg-gray-700/50 flex items-center justify-center text-xs font-bold text-gray-400">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-200 truncate">{ex.name}</p>
                        <p className="text-xs text-gray-500">{ex.sets} sets × {ex.range || '8-12'} reps</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modern Slide to Start */}
            {!isStarting && canStart && (
              <div className="relative h-16 mt-auto">
                <div
                  ref={containerRef}
                  className="relative h-16 bg-gray-800 rounded-full overflow-hidden ring-1 ring-white/10 shadow-inner"
                >
                  {/* Animated Background Gradient */}
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-emerald-500/10 to-transparent opacity-50"
                    style={{ 
                      width: `${(slideProgress * 100) + 20}%`,
                      transition: isDragging ? 'none' : 'width 0.3s ease-out'
                    }}
                  />

                  {/* Shimmer Text */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className={`text-sm font-display font-bold tracking-wide bg-gradient-to-r from-gray-500 via-white to-gray-500 bg-[length:200%_auto] animate-shimmer bg-clip-text text-transparent transition-opacity duration-300 ${
                      slideProgress > 0.2 ? 'opacity-0' : 'opacity-100'
                    }`}>
                      SLIDE TO START
                    </span>
                  </div>

                  {/* Slider Thumb */}
                  <div
                    ref={sliderRef}
                    onMouseDown={handleStart}
                    onTouchStart={handleStart}
                    className={`absolute top-1 left-1 bottom-1 w-14 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg transition-all z-10 ${
                      isDragging ? 'scale-105' : ''
                    } ${slideProgress > 0.9 ? 'bg-emerald-400' : 'bg-emerald-500'}`}
                    style={{
                      transform: `translateX(${slideProgress * (containerRef.current?.offsetWidth - 64 || 0)}px)`,
                      transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
                    }}
                  >
                    <ChevronRight className={`w-6 h-6 text-gray-950 transition-transform duration-300 ${
                      slideProgress > 0.5 ? 'translate-x-1 scale-110' : ''
                    }`} />
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isStarting && (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
                <p className="text-sm text-emerald-400 font-medium animate-pulse">Preparing workout...</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

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
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={!isStarting ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className={`relative w-full sm:max-w-md mx-auto animate-in ${
        isStarting ? 'scale-105 opacity-0' : ''
      } transition-all duration-300`}>
        <Card 
          hover={false} 
          className="p-6 pt-8 rounded-t-3xl sm:rounded-3xl border-t border-gray-700 sm:border"
        >
          {/* Close button */}
          {!isStarting && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Workout icon */}
          <div className={`mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${
            isStarting 
              ? 'bg-emerald-500 scale-110 shadow-[0_0_40px_rgba(16,185,129,0.4)]'
              : 'bg-emerald-500/20'
          }`}>
            {isStarting ? (
              <Zap className="w-10 h-10 text-gray-950" />
            ) : (
              <Dumbbell className="w-10 h-10 text-emerald-400" />
            )}
          </div>

          {/* Workout details */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-100 mb-2">
              {isStarting ? 'Starting...' : workout.name}
            </h2>
            {!isStarting && workout.desc && (
              <p className="text-gray-500 text-sm">{workout.desc}</p>
            )}
            {!isStarting && lastWorkout && (
              <p className="text-xs text-gray-600 mt-2">
                Last performed: {formatLastWorkout(lastWorkout)}
              </p>
            )}
          </div>

          {/* No exercises warning */}
          {noExercisesMessage && !isStarting && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-300">No exercises in this routine</p>
                <p className="text-xs text-amber-400/70 mt-1">
                  Edit this routine to add exercises before starting.
                </p>
              </div>
            </div>
          )}

          {/* Stats row */}
          {!isStarting && canStart && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center p-3 bg-gray-800/50 rounded-xl">
                <Target className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-100">{workout.exercises?.length || 0}</p>
                <p className="text-xs text-gray-500">Exercises</p>
              </div>
              <div className="text-center p-3 bg-gray-800/50 rounded-xl">
                <Clock className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-100">{workout.estTime || '~45 min'}</p>
                <p className="text-xs text-gray-500">Est. Time</p>
              </div>
              <div className="text-center p-3 bg-gray-800/50 rounded-xl">
                <Flame className={`w-5 h-5 mx-auto mb-1 ${
                  intensity.level === 'Low' ? 'text-blue-400' :
                  intensity.level === 'Moderate' ? 'text-emerald-400' :
                  intensity.level === 'High' ? 'text-amber-400' :
                  'text-red-400'
                }`} />
                <p className="text-lg font-bold text-gray-100">{intensity.level}</p>
                <p className="text-xs text-gray-500">Intensity</p>
              </div>
            </div>
          )}

          {/* Exercise preview */}
          {!isStarting && canStart && workout.exercises && (
            <div className="mb-8">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Exercises Preview
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-hide">
                {workout.exercises.slice(0, 5).map((ex, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between py-2 px-3 bg-gray-800/30 rounded-lg"
                  >
                    <span className="text-sm text-gray-300 font-medium">{ex.name}</span>
                    <span className="text-xs text-gray-500">{ex.sets} sets</span>
                  </div>
                ))}
                {workout.exercises.length > 5 && (
                  <p className="text-xs text-gray-600 text-center pt-2">
                    +{workout.exercises.length - 5} more exercises
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Slide to Start - only show when we can start */}
          {!isStarting && canStart && (
            <div
              ref={containerRef}
              className="relative h-16 bg-gray-800/50 rounded-full border-2 border-emerald-500/30 overflow-hidden"
            >
              {/* Progress fill */}
              <div 
                className="absolute inset-y-0 left-0 bg-emerald-500/20 transition-all"
                style={{ 
                  width: `${slideProgress * 100}%`,
                  transition: isDragging ? 'none' : 'width 0.3s ease-out'
                }}
              />

              {/* Text */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className={`text-sm font-semibold transition-opacity ${
                  slideProgress > 0.3 ? 'opacity-0' : 'text-gray-400'
                }`}>
                  Slide to Start Workout →
                </span>
              </div>

              {/* Slider thumb */}
              <div
                ref={sliderRef}
                onMouseDown={handleStart}
                onTouchStart={handleStart}
                className={`absolute top-2 left-2 w-12 h-12 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing transition-all ${
                  isDragging ? 'scale-110 shadow-lg shadow-emerald-500/50' : ''
                } ${slideProgress > 0.9 ? 'bg-emerald-400' : 'bg-emerald-500'}`}
                style={{
                  transform: `translateX(${slideProgress * (containerRef.current?.offsetWidth - 64 - 16 || 0)}px)`,
                  transition: isDragging ? 'none' : 'transform 0.3s ease-out'
                }}
              >
                <ChevronRight className={`w-6 h-6 text-gray-950 transition-transform ${
                  slideProgress > 0.5 ? 'translate-x-0.5' : ''
                }`} />
              </div>
            </div>
          )}

          {/* Loading dots when starting */}
          {isStarting && (
            <div className="flex justify-center gap-1.5 py-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          )}

          {/* Cancel button */}
          {!isStarting && (
            <button
              onClick={onClose}
              className="w-full mt-4 py-3 text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              Cancel
            </button>
          )}
        </Card>
      </div>
    </div>
  );
}

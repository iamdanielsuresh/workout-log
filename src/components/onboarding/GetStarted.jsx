import { useState, useRef, useEffect } from 'react';
import { Dumbbell, ChevronRight, Sparkles } from 'lucide-react';

/**
 * Get Started - Final step with slide to start
 * Beautiful animated completion screen
 */
export function GetStarted({ userName, onComplete }) {
  const [slideProgress, setSlideProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const sliderRef = useRef(null);
  const containerRef = useRef(null);

  const handleStart = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMove = (e) => {
    if (!isDragging || !containerRef.current || !sliderRef.current) return;

    const container = containerRef.current.getBoundingClientRect();
    const slider = sliderRef.current.getBoundingClientRect();
    
    // Get clientX from touch or mouse event
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    
    // Calculate progress (0 to 1)
    const maxSlide = container.width - slider.width - 16; // 16 = padding
    const currentX = clientX - container.left - slider.width / 2 - 8;
    const progress = Math.max(0, Math.min(1, currentX / maxSlide));
    
    setSlideProgress(progress);

    // Complete when fully slid
    if (progress >= 0.95) {
      setIsComplete(true);
      setIsDragging(false);
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      // Delay to show completion animation
      setTimeout(() => {
        onComplete();
      }, 600);
    }
  };

  const handleEnd = () => {
    if (!isComplete) {
      setIsDragging(false);
      // Spring back animation
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
  }, [isDragging, isComplete]);

  return (
    <div className="space-y-8 text-center">
      {/* Animated Icon */}
      <div className="relative mx-auto w-32 h-32">
        {/* Glow rings */}
        <div className={`absolute inset-0 rounded-full bg-emerald-500/20 animate-ping ${isComplete ? 'scale-150' : ''}`} style={{ animationDuration: '2s' }} />
        <div className="absolute inset-2 rounded-full bg-emerald-500/10 animate-pulse" style={{ animationDuration: '1.5s' }} />
        
        {/* Main icon */}
        <div className={`relative w-full h-full rounded-full flex items-center justify-center transition-all duration-500 ${
          isComplete 
            ? 'bg-emerald-500 scale-110 shadow-[0_0_60px_rgba(16,185,129,0.5)]' 
            : 'bg-emerald-500/20'
        }`}>
          {isComplete ? (
            <Sparkles className="w-14 h-14 text-gray-950 animate-spin" style={{ animationDuration: '2s' }} />
          ) : (
            <Dumbbell className="w-14 h-14 text-emerald-400" />
          )}
        </div>
      </div>

      {/* Text */}
      <div className={`transition-all duration-500 ${isComplete ? 'scale-105' : ''}`}>
        <h2 className="text-4xl font-display font-bold text-gray-100 mb-3 tracking-tight">
          {isComplete ? "Let's Go! 🎉" : "You're All Set!"}
        </h2>
        <p className="text-gray-500 text-sm max-w-xs mx-auto">
          {isComplete 
            ? 'Loading your workout dashboard...'
            : `Great job ${userName}! Your personalized workout plan is ready.`
          }
        </p>
      </div>

      {/* Stats Preview */}
      {!isComplete && (
        <div className="grid grid-cols-3 gap-4 py-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">0</p>
            <p className="text-xs text-gray-500">Workouts</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">0</p>
            <p className="text-xs text-gray-500">Day Streak</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">∞</p>
            <p className="text-xs text-gray-500">Potential</p>
          </div>
        </div>
      )}

      {/* Slide to Start */}
      {!isComplete && (
        <div
          ref={containerRef}
          className="relative h-16 bg-gray-800/50 rounded-full border-2 border-gray-700 overflow-hidden mx-4"
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
              slideProgress > 0.3 ? 'opacity-0' : 'text-gray-500'
            }`}>
              Slide to Start →
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

      {/* Loading indicator when complete */}
      {isComplete && (
        <div className="flex justify-center gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

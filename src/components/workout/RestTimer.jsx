import { useState } from 'react';
import { Play, Pause, Minus, Plus } from 'lucide-react';
import { useRestTimer } from '../../hooks/useTimer';

/**
 * Rest timer component with countdown and controls
 */
export function RestTimer({ onComplete }) {
  const {
    isActive,
    timeLeft,
    duration,
    progress,
    toggle,
    adjustDuration,
    formatTimeLeft,
  } = useRestTimer(90);

  // Trigger completion callback
  if (timeLeft === 0 && !isActive && onComplete) {
    onComplete();
  }

  return (
    <div className="bg-gray-900/50 border border-white/10 rounded-xl p-4 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-display font-bold text-gray-400 uppercase tracking-wider">
          Rest Timer
        </span>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => adjustDuration(-15)} 
            className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="text-xs text-gray-500 w-10 text-center font-mono">
            {duration}s
          </span>
          <button 
            onClick={() => adjustDuration(15)} 
            className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          className={`p-3 rounded-full transition-all ${
            isActive
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
          }`}
        >
          {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>

        <div className="flex-1">
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 rounded-full ${
                timeLeft <= 10 ? 'bg-red-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <span className={`text-2xl font-mono font-bold min-w-[72px] text-right ${
          timeLeft <= 10 ? 'text-red-400' : 'text-gray-100'
        }`}>
          {formatTimeLeft()}
        </span>
      </div>
    </div>
  );
}

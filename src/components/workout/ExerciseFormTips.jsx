import { useState, useEffect } from 'react';
import { 
  ChevronDown, ChevronUp, Loader2, AlertCircle, 
  CheckCircle, XCircle, Lightbulb 
} from 'lucide-react';
import { Card } from '../ui/Card';

/**
 * Exercise Form Tips Component
 * Task 9: Auto-Generated Form Tips for Exercises
 * Shows expandable form tips under exercise entries
 */
export function ExerciseFormTips({ 
  exerciseName, 
  tips, 
  loading, 
  onLoadTips,
  defaultExpanded = false 
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Load tips when expanded for the first time
  useEffect(() => {
    if (isExpanded && !tips && onLoadTips) {
      onLoadTips();
    }
  }, [isExpanded, tips, onLoadTips]);

  const toggleExpand = () => {
    setIsExpanded(prev => !prev);
  };

  return (
    <div className="mt-2">
      {/* Toggle Button */}
      <button
        onClick={toggleExpand}
        className="flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : isExpanded ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
        {loading ? 'Loading tips...' : isExpanded ? 'Hide tips' : 'Show form tips'}
      </button>

      {/* Tips Content */}
      {isExpanded && tips && (
        <div className="mt-2 p-3 bg-gray-800/50 rounded-lg space-y-3 animate-in fade-in slide-in-from-top-2">
          {/* Form Description */}
          {tips.formDescription && (
            <div>
              <p className="text-xs text-gray-400 leading-relaxed">
                {tips.formDescription}
              </p>
            </div>
          )}

          {/* Key Cues */}
          {tips.keyCues && tips.keyCues.length > 0 && (
            <div>
              <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                Key Cues
              </p>
              <ul className="space-y-1">
                {tips.keyCues.map((cue, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                    <CheckCircle className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>{cue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Common Mistakes */}
          {tips.commonMistakes && tips.commonMistakes.length > 0 && (
            <div>
              <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Avoid These Mistakes
              </p>
              <ul className="space-y-1">
                {tips.commonMistakes.map((mistake, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                    <XCircle className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>{mistake}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {isExpanded && !tips && !loading && (
        <div className="mt-2 p-3 bg-gray-800/50 rounded-lg">
          <p className="text-xs text-gray-500">
            Unable to load form tips. Try again later.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Inline version for smaller spaces
 */
export function ExerciseFormTipsInline({ tips, loading }) {
  if (loading) {
    return (
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <Loader2 className="w-3 h-3 animate-spin" />
        Loading...
      </div>
    );
  }

  if (!tips) return null;

  return (
    <div className="text-xs text-gray-400 mt-1">
      <span className="text-emerald-400">💡</span>{' '}
      {tips.keyCues?.[0] || tips.formDescription?.slice(0, 50) + '...'}
    </div>
  );
}

export default ExerciseFormTips;

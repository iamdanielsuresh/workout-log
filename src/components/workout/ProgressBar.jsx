/**
 * Progress bar component
 */
export function ProgressBar({ completed, total, showLabel = true }) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden border border-white/5">
        <div
          className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500 shadow-[0_0_10px_-2px_rgba(16,185,129,0.5)]"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-gray-400 min-w-[40px] text-right font-display">
          {completed}/{total}
        </span>
      )}
    </div>
  );
}

/**
 * Circular progress indicator
 */
export function CircularProgress({ value, max = 100, size = 48, strokeWidth = 4 }) {
  const percentage = (value / max) * 100;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-gray-800"
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-emerald-500 transition-all duration-500 ease-out drop-shadow-[0_0_4px_rgba(16,185,129,0.5)]"
      />
    </svg>
  );
}

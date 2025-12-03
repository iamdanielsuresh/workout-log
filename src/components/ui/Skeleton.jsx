/**
 * Skeleton loading components for better UX during data fetching
 */

/**
 * Base skeleton with pulse animation
 */
export function Skeleton({ className = '' }) {
  return (
    <div className={`bg-gray-800 rounded animate-pulse ${className}`} />
  );
}

/**
 * Card skeleton - mimics a Card component loading state
 */
export function CardSkeleton({ lines = 2, className = '' }) {
  return (
    <div className={`bg-gray-900/80 border border-gray-800 rounded-2xl p-5 ${className}`}>
      <div className="animate-pulse space-y-3">
        <div className="h-5 bg-gray-800 rounded w-3/4" />
        {Array.from({ length: lines - 1 }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-800 rounded w-1/2" />
        ))}
      </div>
    </div>
  );
}

/**
 * Workout card skeleton - mimics WorkoutCard loading state
 */
export function WorkoutCardSkeleton() {
  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 animate-pulse">
      <div className="flex items-center gap-4">
        {/* Icon placeholder */}
        <div className="w-12 h-12 bg-gray-800 rounded-xl" />
        
        <div className="flex-1 space-y-2">
          {/* Title */}
          <div className="h-5 bg-gray-800 rounded w-2/3" />
          {/* Subtitle */}
          <div className="h-4 bg-gray-800 rounded w-1/2" />
        </div>
        
        {/* Arrow */}
        <div className="w-5 h-5 bg-gray-800 rounded" />
      </div>
    </div>
  );
}

/**
 * Exercise logger skeleton - mimics ExerciseLogger loading state
 */
export function ExerciseLoggerSkeleton() {
  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-2xl overflow-hidden animate-pulse">
      {/* Header */}
      <div className="p-4 border-b border-gray-800/50">
        <div className="flex items-center gap-3">
          <div className="h-5 bg-gray-800 rounded w-1/3" />
          <div className="h-4 bg-gray-800 rounded w-16" />
        </div>
      </div>
      
      {/* Tips section */}
      <div className="bg-gray-900/50 p-3 border-b border-gray-800/50">
        <div className="h-4 bg-gray-800 rounded w-full" />
      </div>
      
      {/* Sets */}
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-6 h-6 bg-gray-800 rounded" />
            <div className="flex-1 h-12 bg-gray-800 rounded-xl" />
            <div className="flex-1 h-12 bg-gray-800 rounded-xl" />
            <div className="w-10 h-4 bg-gray-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * History item skeleton
 */
export function HistoryItemSkeleton() {
  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-800 rounded-xl" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-800 rounded w-24" />
            <div className="h-3 bg-gray-800 rounded w-16" />
          </div>
        </div>
        <div className="h-4 bg-gray-800 rounded w-12" />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-6 bg-gray-800 rounded-full w-16" />
        ))}
      </div>
    </div>
  );
}

/**
 * Plan card skeleton - mimics plan list items
 */
export function PlanCardSkeleton() {
  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gray-800 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-gray-800 rounded w-1/2" />
          <div className="h-4 bg-gray-800 rounded w-1/3" />
        </div>
        <div className="w-6 h-6 bg-gray-800 rounded" />
      </div>
    </div>
  );
}

/**
 * Stats skeleton - for stat cards
 */
export function StatsSkeleton({ count = 3 }) {
  return (
    <div className={`grid grid-cols-${count} gap-3`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="text-center p-4 bg-gray-900/50 rounded-xl border border-gray-800 animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-12 mx-auto mb-2" />
          <div className="h-3 bg-gray-800 rounded w-16 mx-auto" />
        </div>
      ))}
    </div>
  );
}

/**
 * List skeleton - generic list of items
 */
export function ListSkeleton({ count = 3, ItemSkeleton = CardSkeleton }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <ItemSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Profile skeleton
 */
export function ProfileSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-gray-800 rounded-full" />
        <div className="space-y-2">
          <div className="h-6 bg-gray-800 rounded w-32" />
          <div className="h-4 bg-gray-800 rounded w-24" />
        </div>
      </div>
    </div>
  );
}

/**
 * Full page loading skeleton
 */
export function PageSkeleton({ title = true }) {
  return (
    <div className="p-6 max-w-lg mx-auto space-y-6 animate-pulse">
      {title && (
        <div className="space-y-2">
          <div className="h-8 bg-gray-800 rounded w-1/2" />
          <div className="h-4 bg-gray-800 rounded w-1/3" />
        </div>
      )}
      <div className="space-y-4">
        <CardSkeleton lines={3} />
        <CardSkeleton lines={2} />
        <CardSkeleton lines={2} />
      </div>
    </div>
  );
}

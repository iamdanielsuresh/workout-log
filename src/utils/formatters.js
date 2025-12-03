/**
 * Formatting utilities
 */

/**
 * Format duration in seconds to mm:ss
 */
export function formatDuration(seconds) {
  if (!seconds) return null;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format duration in seconds to human readable (e.g., "45 min")
 */
export function formatDurationMinutes(seconds) {
  if (!seconds) return null;
  const mins = Math.floor(seconds / 60);
  return `${mins} min`;
}

/**
 * Format date to readable string
 */
export function formatDate(date, options = {}) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...options
  });
}

/**
 * Format weight with unit
 */
export function formatWeight(weight, unit = 'kg') {
  if (weight === null || weight === undefined || weight === '') return '';
  const num = parseFloat(weight);
  if (isNaN(num)) return '';
  return `${num}${unit}`;
}

/**
 * Format set display (e.g., "40kg×10")
 */
export function formatSet(set, unit = 'kg') {
  if (!set.weight || !set.reps) return '';
  return `${set.weight}${unit}×${set.reps}`;
}

/**
 * Get relative time string (e.g., "2 days ago")
 */
export function getRelativeTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return formatDate(d);
}

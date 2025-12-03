/**
 * Validation utilities
 */

/**
 * Validate weight input
 */
export function validateWeight(value) {
  if (value === '' || value === null || value === undefined) {
    return { valid: true, value: '' };
  }
  
  const num = parseFloat(value);
  if (isNaN(num)) {
    return { valid: false, error: 'Must be a number' };
  }
  if (num < 0) {
    return { valid: false, error: 'Cannot be negative' };
  }
  if (num > 500) {
    return { valid: false, error: 'Weight seems too high' };
  }
  
  return { valid: true, value: num };
}

/**
 * Validate reps input
 */
export function validateReps(value) {
  if (value === '' || value === null || value === undefined) {
    return { valid: true, value: '' };
  }
  
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    return { valid: false, error: 'Must be a number' };
  }
  if (num < 0) {
    return { valid: false, error: 'Cannot be negative' };
  }
  if (num > 100) {
    return { valid: false, error: 'Reps seem too high' };
  }
  
  return { valid: true, value: num };
}

/**
 * Validate exercise has at least one completed set
 */
export function validateExercise(exercise) {
  if (!exercise || !exercise.sets) return false;
  return exercise.sets.some(set => set.weight && set.reps);
}

/**
 * Validate workout has at least one completed exercise
 */
export function validateWorkout(exercises) {
  if (!exercises || !Array.isArray(exercises)) return false;
  return exercises.some(validateExercise);
}

/**
 * Validate API key format
 */
export function validateApiKey(key) {
  if (!key || key.length < 20) {
    return { valid: false, error: 'API key is too short' };
  }
  if (!key.startsWith('AIza')) {
    return { valid: false, error: 'Invalid format. Google AI keys start with "AIza"' };
  }
  return { valid: true };
}

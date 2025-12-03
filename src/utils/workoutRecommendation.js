/**
 * Smart Workout Recommendation Logic
 * 
 * Determines the best workout to suggest based on:
 * - Last completed workout (follow the plan sequence)
 * - Recent workout history (avoid repetition)
 * - Time since last workout
 * - Overall balance (upper/lower, push/pull distribution)
 */

/**
 * Categorize a workout plan by muscle focus
 * @param {Object} plan - Workout plan with name and exercises
 * @returns {string} Category: 'push', 'pull', 'legs', 'upper', 'lower', 'full', 'other'
 */
export function categorizePlan(plan) {
  if (!plan?.name) return 'other';
  
  const name = plan.name.toLowerCase();
  
  // Direct matches
  if (name.includes('push')) return 'push';
  if (name.includes('pull')) return 'pull';
  if (name.includes('leg')) return 'legs';
  if (name.includes('lower')) return 'lower';
  if (name.includes('upper')) return 'upper';
  if (name.includes('full body') || name.includes('fullbody')) return 'full';
  if (name.includes('chest') || name.includes('shoulder') || name.includes('tricep')) return 'push';
  if (name.includes('back') || name.includes('bicep')) return 'pull';
  
  // Check exercises if name doesn't give clear indication
  if (plan.exercises?.length > 0) {
    const exerciseNames = plan.exercises.map(e => e.name?.toLowerCase() || '').join(' ');
    
    if (exerciseNames.includes('squat') || exerciseNames.includes('deadlift') || exerciseNames.includes('leg')) {
      return 'legs';
    }
    if (exerciseNames.includes('bench') || exerciseNames.includes('press') && !exerciseNames.includes('leg')) {
      return 'push';
    }
    if (exerciseNames.includes('row') || exerciseNames.includes('pull')) {
      return 'pull';
    }
  }
  
  return 'other';
}

/**
 * Get the complementary workout category
 * @param {string} category - Current category
 * @returns {string[]} Array of complementary categories in priority order
 */
function getComplementaryCategories(category) {
  const complements = {
    'push': ['pull', 'legs', 'lower'],
    'pull': ['legs', 'push', 'lower'],
    'legs': ['push', 'pull', 'upper'],
    'upper': ['lower', 'legs', 'full'],
    'lower': ['upper', 'push', 'pull'],
    'full': ['full', 'upper', 'lower'],
    'other': ['push', 'pull', 'legs', 'upper', 'lower', 'full']
  };
  
  return complements[category] || complements['other'];
}

/**
 * Check if user has worked out today
 * @param {Array} workouts - Array of workout sessions
 * @returns {boolean}
 */
export function hasWorkedOutToday(workouts) {
  if (!workouts || workouts.length === 0) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return workouts.some(w => {
    const workoutDate = new Date(w.timestamp);
    workoutDate.setHours(0, 0, 0, 0);
    return workoutDate.getTime() === today.getTime();
  });
}

/**
 * Get days since last workout
 * @param {Object} lastWorkout - Last workout object
 * @returns {number} Days since last workout, or Infinity if no workouts
 */
export function getDaysSinceLastWorkout(lastWorkout) {
  if (!lastWorkout?.timestamp) return Infinity;
  
  const now = new Date();
  const lastDate = new Date(lastWorkout.timestamp);
  const diffTime = Math.abs(now - lastDate);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Get recent workout categories from history
 * @param {Array} workouts - Array of workout sessions
 * @param {Object} plans - Plans object for categorization
 * @param {number} limit - Number of recent workouts to consider
 * @returns {string[]} Array of recent categories
 */
function getRecentCategories(workouts, plans, limit = 5) {
  if (!workouts || workouts.length === 0) return [];
  
  return workouts
    .slice(0, limit)
    .map(w => {
      const plan = plans[w.workoutType];
      return plan ? categorizePlan(plan) : 'other';
    });
}

/**
 * Main recommendation function - determines the best workout to suggest
 * 
 * @param {Object} options
 * @param {Object} options.plans - Available workout plans
 * @param {Array} options.workouts - Recent workout history
 * @param {Object} options.lastWorkout - Most recent workout
 * @param {number} options.streak - Current streak
 * @returns {Object} { recommendedId: string, reason: string }
 */
export function getRecommendedWorkout({ plans, workouts = [], lastWorkout, streak = 0 }) {
  const planKeys = Object.keys(plans || {});
  
  // No plans available
  if (planKeys.length === 0) {
    return { recommendedId: null, reason: 'no_plans' };
  }
  
  // Only one plan - always recommend it
  if (planKeys.length === 1) {
    return { recommendedId: planKeys[0], reason: 'only_plan' };
  }
  
  // First workout ever - suggest first plan
  if (!lastWorkout || workouts.length === 0) {
    return { recommendedId: planKeys[0], reason: 'first_workout' };
  }
  
  // Strategy 1: Follow plan sequence if defined
  if (lastWorkout.workoutType && plans[lastWorkout.workoutType]?.next) {
    const nextId = plans[lastWorkout.workoutType].next;
    if (plans[nextId]) {
      return { recommendedId: nextId, reason: 'plan_sequence' };
    }
  }
  
  // Strategy 2: Smart rotation based on recent history
  const recentCategories = getRecentCategories(workouts, plans, 3);
  const lastCategory = recentCategories[0] || 'other';
  
  // Get complementary categories
  const preferredCategories = getComplementaryCategories(lastCategory);
  
  // Score each plan
  const scoredPlans = planKeys.map(key => {
    const plan = plans[key];
    const category = categorizePlan(plan);
    let score = 0;
    
    // Bonus for complementary muscle groups
    const complementIndex = preferredCategories.indexOf(category);
    if (complementIndex !== -1) {
      score += (preferredCategories.length - complementIndex) * 10;
    }
    
    // Penalty for recently done categories
    recentCategories.forEach((recentCat, index) => {
      if (category === recentCat) {
        score -= (recentCategories.length - index) * 5;
      }
    });
    
    // Bonus if this plan wasn't done recently
    const recentWorkoutTypes = workouts.slice(0, 3).map(w => w.workoutType);
    if (!recentWorkoutTypes.includes(key)) {
      score += 5;
    }
    
    // Slight bonus for AI-generated plans (they're personalized)
    if (plan.source === 'ai-generated') {
      score += 2;
    }
    
    return { key, score, category };
  });
  
  // Sort by score and return best
  scoredPlans.sort((a, b) => b.score - a.score);
  
  return { 
    recommendedId: scoredPlans[0].key, 
    reason: 'smart_rotation',
    category: scoredPlans[0].category
  };
}

/**
 * Generate contextual hint messages for the home screen
 * 
 * @param {Object} options
 * @param {number} options.streak - Current streak
 * @param {Array} options.workouts - Workout history
 * @param {Object} options.lastWorkout - Last workout
 * @param {Object} options.suggestedWorkout - Suggested workout plan
 * @returns {Object|null} { message: string, type: 'info'|'warning'|'motivation' }
 */
export function getNextActionHint({ streak, workouts = [], lastWorkout, suggestedWorkout }) {
  const workedOutToday = hasWorkedOutToday(workouts);
  const daysSinceLastWorkout = getDaysSinceLastWorkout(lastWorkout);
  
  // Already worked out today - celebrate!
  if (workedOutToday) {
    return {
      message: "Great job today! Rest up and come back stronger 💪",
      type: 'success'
    };
  }
  
  // Streak is broken (more than 1 day since last workout)
  if (streak === 0 && lastWorkout && daysSinceLastWorkout > 1) {
    return {
      message: "Restart your streak with a quick session today!",
      type: 'warning'
    };
  }
  
  // Streak at risk (hasn't worked out today but has active streak)
  if (streak > 0 && !workedOutToday) {
    if (streak >= 7) {
      return {
        message: `Keep your ${streak}-day streak alive! You're on fire 🔥`,
        type: 'motivation'
      };
    }
    return {
      message: "Don't break the chain! Start your workout today.",
      type: 'info'
    };
  }
  
  // First time user with no workouts
  if (workouts.length === 0) {
    return {
      message: suggestedWorkout 
        ? `Start your fitness journey with ${suggestedWorkout.name}!` 
        : "Create your first workout plan to get started!",
      type: 'info'
    };
  }
  
  // Been a few days (2-3 days)
  if (daysSinceLastWorkout >= 2 && daysSinceLastWorkout <= 3) {
    return {
      message: "Time to get back at it! Your muscles are ready.",
      type: 'info'
    };
  }
  
  // Been longer (4+ days)
  if (daysSinceLastWorkout >= 4) {
    return {
      message: "It's been a while - start with something light today!",
      type: 'warning'
    };
  }
  
  // Default - haven't worked out today
  return {
    message: "Ready for today's workout?",
    type: 'info'
  };
}

/**
 * Get a brief workout suggestion reason for display
 * @param {string} reason - Reason code from getRecommendedWorkout
 * @param {Object} suggestedWorkout - The suggested workout plan
 * @returns {string} Human-readable reason
 */
export function getRecommendationReason(reason, suggestedWorkout) {
  const reasons = {
    'plan_sequence': 'Next in your routine',
    'smart_rotation': 'Balanced muscle recovery',
    'first_workout': 'Start your journey',
    'only_plan': 'Your workout',
    'no_plans': ''
  };
  
  return reasons[reason] || 'Recommended for you';
}

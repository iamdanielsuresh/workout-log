/**
 * Default workout templates
 * These are used as starting templates for new users
 * Users can customize their own plans which are stored in the database
 */

export const DEFAULT_WORKOUT_PLANS = {
  push: {
    id: 'push',
    name: 'Push (Chest/Delt/Tri)',
    next: 'pull',
    estTime: '45 min',
    desc: 'Upper body pushing strength & hypertrophy.',
    exercises: [
      { name: 'Incline Dumbbell Press', sets: 2, range: '6-9', tip: 'Set bench to 30°. Pause at bottom.' },
      { name: 'Flat Dumbbell Press', sets: 2, range: '8-12', tip: 'Retract scapula. Drive with elbows.' },
      { name: 'Cable Lateral Raise', sets: 3, range: '12-15', tip: 'Set height to wrist. Lead with elbow.' },
      { name: 'Overhead Tricep Ext.', sets: 3, range: '10-15', tip: 'Stretch is key. Keep elbows high.' },
      { name: 'Tricep Pushdown', sets: 2, range: '12-15', tip: 'Elbows glued to sides. Squeeze.' }
    ]
  },
  pull: {
    id: 'pull',
    name: 'Pull (Back/Bi/Forearm)',
    next: 'legs',
    estTime: '50 min',
    desc: 'Back width, thickness, and arm size.',
    exercises: [
      { name: 'Lat Pulldown (Wide)', sets: 2, range: '8-12', tip: 'Drive elbows to hips.' },
      { name: 'Chest-Supported Row', sets: 2, range: '8-12', tip: 'Squeeze back, don\'t pull with arms.' },
      { name: 'Face Pulls', sets: 3, range: '15-20', tip: 'Pull to eyes. External rotation.' },
      { name: 'Incline Dumbbell Curl', sets: 3, range: '10-12', tip: 'Full hang stretch.' },
      { name: 'Hammer Curls', sets: 2, range: '8-10', tip: 'Cross-body for brachialis.' },
      { name: 'Wrist/Reverse Curl', sets: 3, range: '15-20', tip: 'Burnout set. Short rest.' }
    ]
  },
  legs: {
    id: 'legs',
    name: 'Legs + Abs + Cardio',
    next: 'push',
    estTime: '55 min',
    desc: 'Lower body power and core stability.',
    exercises: [
      { name: 'Smith/Hack Squat', sets: 2, range: '6-10', tip: 'Feet forward. Break parallel.' },
      { name: 'RDL (DB)', sets: 2, range: '8-12', tip: 'Hips back. Neutral spine.' },
      { name: 'Leg Extension', sets: 2, range: '12-15', tip: '3-second negative.' },
      { name: 'Weighted Crunch', sets: 3, range: '10-15', tip: 'Curl chest to knees.' },
      { name: 'Hanging Leg Raise', sets: 2, range: 'Failure', tip: 'Control the swing.' },
      { name: 'Incline Walk', sets: 1, range: '15 min', tip: '12% Incline, Speed 3.' }
    ]
  }
};

/**
 * Create a new empty workout plan template
 */
export function createEmptyPlan(id, name) {
  return {
    id,
    name,
    next: null,
    estTime: '45 min',
    desc: '',
    exercises: []
  };
}

/**
 * Create a new exercise template
 */
export function createExercise(name, sets = 3, range = '8-12') {
  return {
    name,
    sets,
    range,
    tip: ''
  };
}

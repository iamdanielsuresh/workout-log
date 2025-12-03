/**
 * Tests for AI workout generator utilities
 */
import { describe, it, expect } from 'vitest';
import {
  calculatePlanIntensity,
  validateGeneratedPlan,
  buildWorkoutGenerationPrompt
} from './aiWorkoutGenerator';

describe('aiWorkoutGenerator', () => {
  describe('calculatePlanIntensity', () => {
    it('returns Unknown for empty plan', () => {
      expect(calculatePlanIntensity(null)).toMatchObject({ level: 'Unknown' });
      expect(calculatePlanIntensity({})).toMatchObject({ level: 'Unknown' });
      expect(calculatePlanIntensity({ exercises: [] })).toMatchObject({ level: 'Unknown' });
    });

    it('calculates intensity for simple plan', () => {
      const plan = {
        exercises: [
          { name: 'Bench Press', sets: 3, range: '8-12' },
          { name: 'Rows', sets: 3, range: '8-12' },
        ]
      };
      const result = calculatePlanIntensity(plan);
      expect(result.score).toBeGreaterThan(0);
      expect(['Low', 'Moderate', 'High', 'Very High']).toContain(result.level);
      expect(result.breakdown.exerciseCount).toBe(2);
      expect(result.breakdown.compoundCount).toBe(2); // Both are compound
    });

    it('identifies compound vs isolation exercises', () => {
      const plan = {
        exercises: [
          { name: 'Squat', sets: 4 },         // compound
          { name: 'Deadlift', sets: 4 },      // compound
          { name: 'Bicep Curl', sets: 3 },    // isolation
          { name: 'Tricep Extension', sets: 3 }, // isolation
        ]
      };
      const result = calculatePlanIntensity(plan);
      expect(result.breakdown.compoundCount).toBe(2);
      expect(result.breakdown.isolationCount).toBe(2);
      expect(result.breakdown.compoundRatio).toBe(50);
    });

    it('higher volume = higher intensity', () => {
      const lowVolume = {
        exercises: [
          { name: 'Curls', sets: 2, range: '8-10' },
        ]
      };
      const highVolume = {
        exercises: [
          { name: 'Squat', sets: 5, range: '8-12' },
          { name: 'Deadlift', sets: 5, range: '5-8' },
          { name: 'Bench Press', sets: 4, range: '8-10' },
          { name: 'Rows', sets: 4, range: '8-12' },
          { name: 'Press', sets: 3, range: '8-12' },
        ]
      };
      
      const lowResult = calculatePlanIntensity(lowVolume);
      const highResult = calculatePlanIntensity(highVolume);
      
      expect(highResult.score).toBeGreaterThan(lowResult.score);
    });
  });

  describe('validateGeneratedPlan', () => {
    it('rejects null/undefined input', () => {
      expect(validateGeneratedPlan(null)).toMatchObject({ valid: false });
      expect(validateGeneratedPlan(undefined)).toMatchObject({ valid: false });
    });

    it('rejects missing plans object', () => {
      const result = validateGeneratedPlan({ foo: 'bar' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Missing plans');
    });

    it('rejects empty plans', () => {
      const result = validateGeneratedPlan({ plans: {} });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('No workout days');
    });

    it('validates and cleans a proper plan', () => {
      const input = {
        plans: {
          day1: {
            name: 'Push Day',
            exercises: [
              { name: 'Bench Press', sets: 3, range: '8-12' }
            ]
          }
        },
        programName: 'Test Program'
      };
      
      const result = validateGeneratedPlan(input);
      expect(result.valid).toBe(true);
      expect(result.cleaned.plans.day1.name).toBe('Push Day');
      expect(result.cleaned.plans.day1.exercises[0].name).toBe('Bench Press');
    });

    it('fills in missing exercise defaults', () => {
      const input = {
        plans: {
          day1: {
            name: 'Test Day',
            exercises: [
              { name: 'Some Exercise' } // minimal data
            ]
          }
        }
      };
      
      const result = validateGeneratedPlan(input);
      expect(result.valid).toBe(true);
      const exercise = result.cleaned.plans.day1.exercises[0];
      expect(exercise.sets).toBe(3);
      expect(exercise.range).toBe('8-12');
      expect(exercise.restPeriod).toBe('90 sec');
    });

    it('rejects plans with no valid exercises', () => {
      const input = {
        plans: {
          day1: {
            name: 'Empty Day',
            exercises: [
              { notName: 'invalid' }, // missing name
              {}, // empty
            ]
          }
        }
      };
      
      const result = validateGeneratedPlan(input);
      expect(result.valid).toBe(false);
    });

    it('handles multiple days with proper next linking', () => {
      const input = {
        plans: {
          day1: {
            name: 'Day 1',
            exercises: [{ name: 'Exercise A' }]
          },
          day2: {
            name: 'Day 2', 
            exercises: [{ name: 'Exercise B' }]
          },
          day3: {
            name: 'Day 3',
            exercises: [{ name: 'Exercise C' }]
          }
        }
      };
      
      const result = validateGeneratedPlan(input);
      expect(result.valid).toBe(true);
      expect(Object.keys(result.cleaned.plans)).toHaveLength(3);
    });

    it('preserves optional metadata fields', () => {
      const input = {
        plans: {
          day1: {
            name: 'Test Day',
            desc: 'Day description',
            estTime: '45 min',
            focus: 'strength',
            dayTip: 'Stay hydrated',
            exercises: [{ name: 'Exercise' }]
          }
        },
        programName: 'My Program',
        programDescription: 'Description here'
      };
      
      const result = validateGeneratedPlan(input);
      expect(result.cleaned.plans.day1.desc).toBe('Day description');
      expect(result.cleaned.plans.day1.estTime).toBe('45 min');
      expect(result.cleaned.programName).toBe('My Program');
    });
  });

  describe('buildWorkoutGenerationPrompt', () => {
    it('builds a valid prompt with basic options', () => {
      const prompt = buildWorkoutGenerationPrompt({
        daysPerWeek: 3,
        focus: 'hypertrophy',
        duration: '45-60',
        equipment: 'full'
      });
      
      expect(prompt).toContain('3');
      expect(prompt).toContain('hypertrophy');
      expect(prompt).toContain('45-60');
      expect(prompt).toContain('Full gym');
      expect(prompt).toContain('JSON');
    });

    it('handles minimal equipment option', () => {
      const prompt = buildWorkoutGenerationPrompt({
        daysPerWeek: 2,
        focus: 'strength',
        duration: '30',
        equipment: 'minimal'
      });
      
      expect(prompt).toContain('dumbbells');
    });

    it('handles bodyweight option', () => {
      const prompt = buildWorkoutGenerationPrompt({
        daysPerWeek: 4,
        focus: 'balanced',
        duration: '30',
        equipment: 'bodyweight'
      });
      
      expect(prompt).toContain('Bodyweight');
    });

    it('includes user context when provided', () => {
      const userContext = {
        profile: {
          experienceLevel: 'beginner',
          age: 25
        },
        stats: {
          totalWorkouts: 10
        },
        patterns: {
          avgExercisesPerWorkout: 5,
          avgDurationMins: 40,
          muscleGroupDistribution: { chest: 5, back: 3 }
        },
        weakAreas: ['Legs', 'Core']
      };
      
      const prompt = buildWorkoutGenerationPrompt({
        daysPerWeek: 3,
        focus: 'balanced',
        duration: '45',
        userContext
      });
      
      expect(prompt).toContain('beginner');
      expect(prompt).toContain('10 total workouts');
      expect(prompt).toContain('Legs');
      expect(prompt).toContain('Core');
    });
  });
});

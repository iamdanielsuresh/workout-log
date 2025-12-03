/**
 * Tests for workoutRecommendation utility functions
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getRecommendedWorkout,
  getNextActionHint,
  getRecommendationReason,
  categorizePlan,
  hasWorkedOutToday,
  getDaysSinceLastWorkout
} from './workoutRecommendation';

describe('workoutRecommendation', () => {
  // Mock workout plans
  const mockPlans = {
    'push-day': {
      id: 'push-day',
      name: 'Push Day',
      exercises: [
        { name: 'Bench Press' },
        { name: 'Shoulder Press' },
      ],
      next: 'pull-day'
    },
    'pull-day': {
      id: 'pull-day', 
      name: 'Pull Day',
      exercises: [
        { name: 'Rows' },
        { name: 'Lat Pulldown' },
      ],
      next: 'leg-day'
    },
    'leg-day': {
      id: 'leg-day',
      name: 'Leg Day',
      exercises: [
        { name: 'Squats' },
        { name: 'Leg Press' },
      ],
      next: 'push-day'
    },
  };

  describe('getRecommendedWorkout', () => {
    it('returns null recommendedId when no plans exist', () => {
      const result = getRecommendedWorkout({ plans: {}, workouts: [] });
      expect(result.recommendedId).toBeNull();
      expect(result.reason).toBe('no_plans');
    });

    it('returns first plan for new users with no workout history', () => {
      const result = getRecommendedWorkout({ plans: mockPlans, workouts: [] });
      expect(result.recommendedId).toBe('push-day');
      expect(result.reason).toBe('first_workout');
    });

    it('recommends next plan in sequence after last workout', () => {
      const lastWorkout = {
        workoutType: 'push-day',
        workoutName: 'Push Day',
        timestamp: new Date(),
      };
      const workouts = [lastWorkout];
      const result = getRecommendedWorkout({ plans: mockPlans, workouts, lastWorkout });
      expect(result.recommendedId).toBe('pull-day');
      expect(result.reason).toBe('plan_sequence');
    });

    it('wraps around to first plan after completing sequence', () => {
      const lastWorkout = {
        workoutType: 'leg-day',
        workoutName: 'Leg Day',
        timestamp: new Date(),
      };
      const workouts = [lastWorkout];
      const result = getRecommendedWorkout({ plans: mockPlans, workouts, lastWorkout });
      expect(result.recommendedId).toBe('push-day');
      expect(result.reason).toBe('plan_sequence');
    });

    it('returns only_plan reason when single plan exists', () => {
      const singlePlan = { 'only-plan': { id: 'only-plan', name: 'Only Plan' } };
      const result = getRecommendedWorkout({ plans: singlePlan, workouts: [] });
      expect(result.recommendedId).toBe('only-plan');
      expect(result.reason).toBe('only_plan');
    });
  });

  describe('categorizePlan', () => {
    it('identifies push workouts', () => {
      expect(categorizePlan({ name: 'Push Day' })).toBe('push');
      expect(categorizePlan({ name: 'Chest & Triceps' })).toBe('push');
    });

    it('identifies pull workouts', () => {
      expect(categorizePlan({ name: 'Pull Day' })).toBe('pull');
      expect(categorizePlan({ name: 'Back & Biceps' })).toBe('pull');
    });

    it('identifies leg workouts', () => {
      expect(categorizePlan({ name: 'Leg Day' })).toBe('legs');
      expect(categorizePlan({ name: 'Lower Body' })).toBe('lower');
    });

    it('identifies full body workouts', () => {
      expect(categorizePlan({ name: 'Full Body A' })).toBe('full');
    });

    it('returns other for unknown types', () => {
      expect(categorizePlan({ name: 'Mystery Workout' })).toBe('other');
      expect(categorizePlan(null)).toBe('other');
    });
  });

  describe('hasWorkedOutToday', () => {
    it('returns false for empty workouts', () => {
      expect(hasWorkedOutToday([])).toBe(false);
      expect(hasWorkedOutToday(null)).toBe(false);
    });

    it('returns true if workout done today', () => {
      const workouts = [{ timestamp: new Date() }];
      expect(hasWorkedOutToday(workouts)).toBe(true);
    });

    it('returns false if workout was yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const workouts = [{ timestamp: yesterday }];
      expect(hasWorkedOutToday(workouts)).toBe(false);
    });
  });

  describe('getDaysSinceLastWorkout', () => {
    it('returns Infinity for no last workout', () => {
      expect(getDaysSinceLastWorkout(null)).toBe(Infinity);
      expect(getDaysSinceLastWorkout({})).toBe(Infinity);
    });

    it('returns 0 for workout done today', () => {
      const result = getDaysSinceLastWorkout({ timestamp: new Date() });
      expect(result).toBe(0);
    });

    it('returns correct days for past workout', () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const result = getDaysSinceLastWorkout({ timestamp: twoDaysAgo });
      expect(result).toBe(2);
    });
  });

  describe('getNextActionHint', () => {
    it('returns welcome hint for new users', () => {
      const hint = getNextActionHint({ workouts: [], streak: 0 });
      expect(hint.type).toBe('info');
      expect(hint.message).toBeDefined();
    });

    it('returns success hint after workout today', () => {
      const todayWorkout = { timestamp: new Date() };
      const hint = getNextActionHint({ 
        workouts: [todayWorkout], 
        streak: 1,
        lastWorkout: todayWorkout
      });
      expect(hint.type).toBe('success');
      expect(hint.message).toContain('Great job');
    });

    it('returns motivation hint for long streak', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const workouts = [{ timestamp: yesterday }];
      const hint = getNextActionHint({ 
        workouts, 
        streak: 10,
        lastWorkout: workouts[0]
      });
      expect(hint.type).toBe('motivation');
      expect(hint.message).toContain('10-day streak');
    });

    it('returns warning hint for broken streak', () => {
      const oldWorkout = new Date();
      oldWorkout.setDate(oldWorkout.getDate() - 5);
      const workouts = [{ timestamp: oldWorkout }];
      const hint = getNextActionHint({ 
        workouts, 
        streak: 0,
        lastWorkout: workouts[0]
      });
      expect(hint.type).toBe('warning');
    });

    it('handles missing plans gracefully', () => {
      const hint = getNextActionHint({ workouts: [], streak: 0 });
      expect(hint).toBeDefined();
      expect(hint.message).toBeDefined();
    });
  });

  describe('getRecommendationReason', () => {
    it('returns human-readable reasons', () => {
      expect(getRecommendationReason('plan_sequence')).toBe('Next in your routine');
      expect(getRecommendationReason('first_workout')).toBe('Start your journey');
      expect(getRecommendationReason('smart_rotation')).toBe('Balanced muscle recovery');
    });

    it('returns default for unknown reason', () => {
      expect(getRecommendationReason('unknown')).toBe('Recommended for you');
    });
  });
});

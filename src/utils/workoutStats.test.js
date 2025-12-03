/**
 * Tests for workoutStats utility functions
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getCurrentStreak,
  getTotalWorkouts,
  getAverageSessionDuration,
  getRecentFocusDistribution,
  getWorkoutsThisWeek,
  getWorkoutsThisMonth,
  getMostWorkedFocus,
  getWorkoutSummary,
  calculateOneRepMax,
  getWeeklyVolume,
  analyzeStrengthTrends
} from './workoutStats';

describe('workoutStats', () => {
  describe('getTotalWorkouts', () => {
    it('returns 0 for empty or null sessions', () => {
      expect(getTotalWorkouts([])).toBe(0);
      expect(getTotalWorkouts(null)).toBe(0);
      expect(getTotalWorkouts(undefined)).toBe(0);
    });

    it('returns correct count for sessions', () => {
      const sessions = [{ id: 1 }, { id: 2 }, { id: 3 }];
      expect(getTotalWorkouts(sessions)).toBe(3);
    });
  });

  describe('getCurrentStreak', () => {
    it('returns 0 for empty sessions', () => {
      expect(getCurrentStreak([])).toBe(0);
      expect(getCurrentStreak(null)).toBe(0);
    });

    it('returns 1 for a workout done today', () => {
      const today = new Date();
      const sessions = [{ timestamp: today.toISOString() }];
      expect(getCurrentStreak(sessions)).toBe(1);
    });

    it('returns 1 for a workout done yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const sessions = [{ timestamp: yesterday.toISOString() }];
      expect(getCurrentStreak(sessions)).toBe(1);
    });

    it('returns correct streak for consecutive days', () => {
      const today = new Date();
      const sessions = [
        { timestamp: today.toISOString() },
        { timestamp: new Date(today.getTime() - 86400000).toISOString() }, // yesterday
        { timestamp: new Date(today.getTime() - 172800000).toISOString() }, // 2 days ago
      ];
      expect(getCurrentStreak(sessions)).toBeGreaterThanOrEqual(2);
    });

    it('handles multiple workouts on same day', () => {
      const today = new Date();
      const sessions = [
        { timestamp: today.toISOString() },
        { timestamp: today.toISOString() }, // same day
      ];
      expect(getCurrentStreak(sessions)).toBe(1);
    });

    it('returns 0 for old workout (streak broken)', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10);
      const sessions = [{ timestamp: oldDate.toISOString() }];
      expect(getCurrentStreak(sessions)).toBe(0);
    });
  });

  describe('getAverageSessionDuration', () => {
    it('returns 0 for empty sessions', () => {
      expect(getAverageSessionDuration([])).toBe(0);
      expect(getAverageSessionDuration(null)).toBe(0);
    });

    it('calculates average from duration_minutes field', () => {
      const sessions = [
        { duration_minutes: 30 },
        { duration_minutes: 60 },
        { duration_minutes: 45 },
      ];
      expect(getAverageSessionDuration(sessions)).toBe(45);
    });

    it('calculates average from duration (seconds) field', () => {
      const sessions = [
        { duration: 1800 }, // 30 min
        { duration: 3600 }, // 60 min
      ];
      expect(getAverageSessionDuration(sessions)).toBe(45);
    });

    it('calculates from start/end times', () => {
      const start = new Date('2024-01-01T10:00:00Z');
      const end = new Date('2024-01-01T10:45:00Z');
      const sessions = [{ started_at: start.toISOString(), completed_at: end.toISOString() }];
      expect(getAverageSessionDuration(sessions)).toBe(45);
    });

    it('ignores sessions without duration data', () => {
      const sessions = [
        { duration_minutes: 30 },
        { note: 'no duration' }, // no duration data
        { duration_minutes: 60 },
      ];
      expect(getAverageSessionDuration(sessions)).toBe(45);
    });
  });

  describe('getRecentFocusDistribution', () => {
    it('returns empty distribution for no sessions', () => {
      const result = getRecentFocusDistribution([]);
      expect(result).toEqual({ Upper: 0, Lower: 0, Full: 0, Other: 0 });
    });

    it('identifies upper body workouts from plan name', () => {
      const sessions = [
        { plan_name: 'Push Day', timestamp: new Date().toISOString() },
        { plan_name: 'Pull Day', timestamp: new Date().toISOString() },
        { plan_name: 'Chest & Shoulders', timestamp: new Date().toISOString() },
      ];
      const result = getRecentFocusDistribution(sessions);
      expect(result.Upper).toBe(3);
    });

    it('identifies lower body workouts', () => {
      const sessions = [
        { plan_name: 'Leg Day', timestamp: new Date().toISOString() },
        { plan_name: 'Lower Body', timestamp: new Date().toISOString() },
      ];
      const result = getRecentFocusDistribution(sessions);
      expect(result.Lower).toBe(2);
    });

    it('identifies full body workouts', () => {
      const sessions = [
        { plan_name: 'Full Body A', timestamp: new Date().toISOString() },
        { focus: 'full body', timestamp: new Date().toISOString() },
      ];
      const result = getRecentFocusDistribution(sessions);
      expect(result.Full).toBe(2);
    });

    it('respects limit parameter', () => {
      const sessions = Array(20).fill(null).map((_, i) => ({
        plan_name: 'Push Day',
        timestamp: new Date(Date.now() - i * 86400000).toISOString(),
      }));
      const result = getRecentFocusDistribution(sessions, 5);
      expect(result.Upper).toBe(5);
    });

    it('analyzes exercises when plan name unclear', () => {
      const sessions = [{
        plan_name: 'Workout A',
        exercises: [
          { name: 'Bench Press' },
          { name: 'Shoulder Press' },
          { name: 'Tricep Extension' },
          { name: 'Lat Pulldown' },
        ],
        timestamp: new Date().toISOString(),
      }];
      const result = getRecentFocusDistribution(sessions);
      expect(result.Upper).toBe(1);
    });
  });

  describe('getWorkoutsThisWeek', () => {
    it('returns 0 for empty sessions', () => {
      expect(getWorkoutsThisWeek([])).toBe(0);
    });

    it('counts workouts from current week', () => {
      const today = new Date();
      const sessions = [
        { timestamp: today.toISOString() },
        { timestamp: new Date(today.getTime() - 86400000).toISOString() }, // yesterday
      ];
      // Depending on day of week, this might be 1 or 2
      expect(getWorkoutsThisWeek(sessions)).toBeGreaterThanOrEqual(1);
    });

    it('excludes workouts from previous weeks', () => {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 14); // 2 weeks ago
      const sessions = [{ timestamp: lastWeek.toISOString() }];
      expect(getWorkoutsThisWeek(sessions)).toBe(0);
    });
  });

  describe('getWorkoutsThisMonth', () => {
    it('returns 0 for empty sessions', () => {
      expect(getWorkoutsThisMonth([])).toBe(0);
    });

    it('counts workouts from current month', () => {
      const today = new Date();
      const sessions = [
        { timestamp: today.toISOString() },
      ];
      expect(getWorkoutsThisMonth(sessions)).toBe(1);
    });
  });

  describe('getMostWorkedFocus', () => {
    it('returns null for empty sessions', () => {
      expect(getMostWorkedFocus([])).toBeNull();
    });

    it('returns most common focus area', () => {
      const sessions = [
        { plan_name: 'Push Day', timestamp: new Date().toISOString() },
        { plan_name: 'Pull Day', timestamp: new Date().toISOString() },
        { plan_name: 'Upper Body', timestamp: new Date().toISOString() },
        { plan_name: 'Leg Day', timestamp: new Date().toISOString() },
      ];
      expect(getMostWorkedFocus(sessions)).toBe('Upper');
    });
  });

  describe('getWorkoutSummary', () => {
    it('returns complete summary object', () => {
      const today = new Date();
      const sessions = [
        { 
          timestamp: today.toISOString(),
          duration_minutes: 45,
          plan_name: 'Push Day'
        },
      ];
      
      const summary = getWorkoutSummary(sessions);
      
      expect(summary).toHaveProperty('totalWorkouts', 1);
      expect(summary).toHaveProperty('currentStreak');
      expect(summary).toHaveProperty('averageDuration', 45);
      expect(summary).toHaveProperty('workoutsThisWeek');
      expect(summary).toHaveProperty('workoutsThisMonth');
      expect(summary).toHaveProperty('focusDistribution');
      expect(summary).toHaveProperty('mostWorkedFocus');
    });

    it('handles empty sessions', () => {
      const summary = getWorkoutSummary([]);
      
      expect(summary.totalWorkouts).toBe(0);
      expect(summary.currentStreak).toBe(0);
      expect(summary.averageDuration).toBe(0);
    });
  });

  describe('calculateOneRepMax', () => {
    it('calculates 1RM using Epley formula', () => {
      // 100kg for 1 rep = 100
      expect(Math.round(calculateOneRepMax(100, 1))).toBe(100);
      // 100kg for 10 reps = 100 * (1 + 10/30) = 133.33
      expect(Math.round(calculateOneRepMax(100, 10))).toBe(133);
    });

    it('returns 0 for invalid inputs', () => {
      expect(calculateOneRepMax(0, 10)).toBe(0);
      expect(calculateOneRepMax(100, 0)).toBe(0);
    });
  });

  describe('getWeeklyVolume', () => {
    it('calculates total sets per type for the last 7 days', () => {
      const today = new Date();
      const sessions = [
        {
          timestamp: today.toISOString(),
          workout_type: 'Upper Body',
          exercises: [
            { sets: [{ weight: 100, reps: 5 }, { weight: 100, reps: 5 }] } // 2 sets
          ]
        },
        {
          timestamp: today.toISOString(),
          workout_type: 'Lower Body',
          exercises: [
            { sets: [{ weight: 50, reps: 10 }] } // 1 set
          ]
        }
      ];
      
      const volume = getWeeklyVolume(sessions);
      expect(volume['Upper Body']).toBe(2);
      expect(volume['Lower Body']).toBe(1);
    });

    it('ignores workouts older than 7 days', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 8);
      
      const sessions = [
        {
          timestamp: oldDate.toISOString(),
          workout_type: 'Upper Body',
          exercises: [
            { sets: [{ weight: 100, reps: 5 }] }
          ]
        }
      ];
      expect(Object.keys(getWeeklyVolume(sessions)).length).toBe(0);
    });
  });

  describe('analyzeStrengthTrends', () => {
    it('identifies improvement in 1RM', () => {
      const today = new Date();
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const sessions = [
        {
          timestamp: today.toISOString(),
          exercises: [
            { 
              name: 'Bench Press',
              sets: [{ weight: 100, reps: 5 }] // 1RM ~117
            }
          ]
        },
        {
          timestamp: lastWeek.toISOString(),
          exercises: [
            { 
              name: 'Bench Press',
              sets: [{ weight: 90, reps: 5 }] // 1RM ~105
            }
          ]
        }
      ];
      
      const trends = analyzeStrengthTrends(sessions);
      // Keys are lowercased in implementation
      expect(trends['bench press']).toBeDefined();
      expect(trends['bench press'].improvement).toBeGreaterThan(0);
      expect(trends['bench press'].current1RM).toBeGreaterThan(100);
    });

    it('returns empty object for exercises with insufficient history', () => {
      const sessions = [
        {
          timestamp: new Date().toISOString(),
          exercises: [
            { 
              name: 'New Exercise',
              sets: [{ weight: 50, reps: 10 }]
            }
          ]
        }
      ];
      
      const trends = analyzeStrengthTrends(sessions);
      expect(trends['new exercise']).toBeUndefined();
    });
  });
});

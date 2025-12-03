import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { createLogger } from '../utils/logger';
import { getCurrentStreak } from '../utils/workoutStats';

const log = createLogger('useWorkouts');

/**
 * Hook for managing workouts and history
 */
export function useWorkouts(userId) {
  const [workouts, setWorkouts] = useState([]);
  const [history, setHistory] = useState({});
  const [lastWorkout, setLastWorkout] = useState(null);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch workouts
  const fetchWorkouts = useCallback(async () => {
    if (!userId) return;

    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) {
        throw fetchError;
      }

      const historyMap = {};
      const sessions = [];

      data?.forEach((row, index) => {
        const sessionData = {
          id: row.id,
          workoutType: row.workout_type,
          workoutName: row.workout_name,
          timestamp: new Date(row.created_at),
          // Task 3: Include start_time and workout_date
          startTime: row.start_time ? new Date(row.start_time) : null,
          workoutDate: row.workout_date || new Date(row.created_at).toISOString().split('T')[0],
          exercises: row.exercises || [],
          note: row.note,
          duration: row.duration
        };
        sessions.push(sessionData);
        
        // Build history map (most recent entry for each exercise)
        sessionData.exercises.forEach(ex => {
          if (!historyMap[ex.name]) historyMap[ex.name] = ex;
        });
      });

      setWorkouts(sessions);
      setHistory(historyMap);
      setLastWorkout(sessions[0] || null);
      setStreak(getCurrentStreak(sessions));
    } catch (err) {
      log.error('Error fetching workouts:', err);
      setError(err.message || 'Failed to load workouts');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial fetch and realtime subscription
  useEffect(() => {
    if (!userId) {
      setWorkouts([]);
      setHistory({});
      setLastWorkout(null);
      setStreak(0);
      setLoading(false);
      return;
    }

    fetchWorkouts();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('workout_logs_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'workout_logs', filter: `user_id=eq.${userId}` },
        () => fetchWorkouts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchWorkouts]);

  // Save a workout
  const saveWorkout = useCallback(async (workout) => {
    if (!userId) throw new Error('No user ID');

    // Task 3: Include start_time and workout_date
    const workoutDate = workout.workoutDate || new Date().toISOString().split('T')[0];
    const startTime = workout.startTime || new Date().toISOString();

    const { error } = await supabase
      .from('workout_logs')
      .insert({
        user_id: userId,
        workout_type: workout.workoutType,
        workout_name: workout.workoutName,
        exercises: workout.exercises,
        note: workout.note,
        duration: workout.duration,
        start_time: startTime,
        workout_date: workoutDate
      });

    if (error) throw error;
  }, [userId]);

  // Delete a workout
  const deleteWorkout = useCallback(async (workoutId) => {
    if (!userId) throw new Error('No user ID');

    // Optimistic update
    setWorkouts(prev => prev.filter(w => w.id !== workoutId));
    setHistory(prev => {
      const newHistory = { ...prev };
      // This is a simplification; ideally we'd find the next most recent log for affected exercises
      // But for deletion, just removing from the list is the most visible change needed
      return newHistory;
    });

    const { error } = await supabase
      .from('workout_logs')
      .delete()
      .eq('id', workoutId)
      .eq('user_id', userId);

    if (error) {
      // Revert on error
      fetchWorkouts();
      throw error;
    }
  }, [userId, fetchWorkouts]);

  return {
    workouts,
    history,
    lastWorkout,
    streak,
    loading,
    error,
    saveWorkout,
    deleteWorkout,
    refresh: fetchWorkouts,
    clearError: () => setError(null),
  };
}

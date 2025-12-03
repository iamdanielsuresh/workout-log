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

    const { error } = await supabase
      .from('workout_logs')
      .insert({
        user_id: userId,
        workout_type: workout.workoutType,
        workout_name: workout.workoutName,
        exercises: workout.exercises,
        note: workout.note,
        duration: workout.duration
      });

    if (error) throw error;
  }, [userId]);

  // Delete a workout
  const deleteWorkout = useCallback(async (workoutId) => {
    if (!userId) throw new Error('No user ID');

    const { error } = await supabase
      .from('workout_logs')
      .delete()
      .eq('id', workoutId)
      .eq('user_id', userId);

    if (error) throw error;
  }, [userId]);

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

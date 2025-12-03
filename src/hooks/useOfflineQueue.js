import { useState, useEffect, useCallback } from 'react';
import { createLogger } from '../utils/logger';

const log = createLogger('useOfflineQueue');
const QUEUE_STORAGE_KEY = 'workout-offline-queue';

/**
 * useOfflineQueue - Manages offline workout queue for sync when online
 * Stores pending workouts in localStorage and syncs when connection restored
 */
export function useOfflineQueue(saveWorkout) {
  const [queue, setQueue] = useState([]);
  const [isSyncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Load queue from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setQueue(parsed);
        log.log(`Loaded ${parsed.length} pending workouts from queue`);
      }
    } catch (error) {
      log.error('Failed to load offline queue:', error);
    }
  }, []);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch (error) {
      log.error('Failed to save offline queue:', error);
    }
  }, [queue]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      log.log('Connection restored');
      setIsOnline(true);
    };
    
    const handleOffline = () => {
      log.log('Connection lost');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync queue when online
  useEffect(() => {
    if (isOnline && queue.length > 0 && !isSyncing && saveWorkout) {
      syncQueue();
    }
  }, [isOnline, queue.length, saveWorkout]);

  // Add workout to queue
  const addToQueue = useCallback((workout) => {
    const queuedWorkout = {
      ...workout,
      queuedAt: new Date().toISOString(),
      id: `queued-${Date.now()}`
    };
    
    setQueue(prev => [...prev, queuedWorkout]);
    log.log('Added workout to offline queue:', queuedWorkout.workoutName);
    
    return queuedWorkout;
  }, []);

  // Sync all queued workouts
  const syncQueue = useCallback(async () => {
    if (isSyncing || !saveWorkout || queue.length === 0) return;

    setSyncing(true);
    log.log(`Syncing ${queue.length} queued workouts...`);

    const failedWorkouts = [];
    
    for (const workout of queue) {
      try {
        // Remove queue-specific fields before saving
        const { queuedAt, id: queuedId, ...workoutData } = workout;
        await saveWorkout(workoutData);
        log.log('Synced workout:', workout.workoutName);
      } catch (error) {
        log.error('Failed to sync workout:', error);
        failedWorkouts.push(workout);
      }
    }

    // Update queue with only failed workouts
    setQueue(failedWorkouts);
    setSyncing(false);
    
    log.log(`Sync complete. ${failedWorkouts.length} workouts failed.`);
    
    return {
      synced: queue.length - failedWorkouts.length,
      failed: failedWorkouts.length
    };
  }, [queue, saveWorkout, isSyncing]);

  // Remove workout from queue
  const removeFromQueue = useCallback((queuedId) => {
    setQueue(prev => prev.filter(w => w.id !== queuedId));
  }, []);

  // Clear entire queue
  const clearQueue = useCallback(() => {
    setQueue([]);
    localStorage.removeItem(QUEUE_STORAGE_KEY);
  }, []);

  return {
    queue,
    queueCount: queue.length,
    isOnline,
    isSyncing,
    addToQueue,
    syncQueue,
    removeFromQueue,
    clearQueue
  };
}

export default useOfflineQueue;

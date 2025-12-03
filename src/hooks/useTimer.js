import { useState, useEffect, useCallback, useRef } from 'react';
import { createLogger } from '../utils/logger';

const log = createLogger('useTimer');
const TIMER_STORAGE_KEY = 'workout-timer-state';

/**
 * Hook for workout duration timer
 * Uses timestamp-based calculation to survive app backgrounding and page navigations
 */
export function useTimer(isActive = false) {
  const [seconds, setSeconds] = useState(0);
  const startTimeRef = useRef(null);
  const accumulatedRef = useRef(0);
  const animationFrameRef = useRef(null);

  // Calculate elapsed time from start timestamp plus any accumulated time
  const calculateElapsed = useCallback(() => {
    if (startTimeRef.current === null) {
      return accumulatedRef.current;
    }
    const now = Date.now();
    const elapsed = Math.floor((now - startTimeRef.current) / 1000);
    return accumulatedRef.current + elapsed;
  }, []);

  // Save timer state to localStorage
  const saveTimerState = useCallback(() => {
    if (startTimeRef.current !== null) {
      const state = {
        startTime: startTimeRef.current,
        accumulated: accumulatedRef.current,
        savedAt: Date.now()
      };
      try {
        localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        log.error('Failed to save timer state:', error);
      }
    }
  }, []);

  // Load timer state from localStorage
  const loadTimerState = useCallback(() => {
    try {
      const stored = localStorage.getItem(TIMER_STORAGE_KEY);
      if (stored) {
        const state = JSON.parse(stored);
        return state;
      }
    } catch (error) {
      log.error('Failed to load timer state:', error);
    }
    return null;
  }, []);

  // Clear timer state from localStorage
  const clearTimerState = useCallback(() => {
    try {
      localStorage.removeItem(TIMER_STORAGE_KEY);
    } catch (error) {
      log.error('Failed to clear timer state:', error);
    }
  }, []);

  // Update loop using requestAnimationFrame for efficient updates
  const updateTimer = useCallback(() => {
    const elapsed = calculateElapsed();
    setSeconds(elapsed);
    animationFrameRef.current = requestAnimationFrame(updateTimer);
  }, [calculateElapsed]);

  // Handle visibility change - recalculate elapsed time when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActive && startTimeRef.current !== null) {
        // Recalculate elapsed time when becoming visible
        const elapsed = calculateElapsed();
        setSeconds(elapsed);
        log.log('Tab visible, updated elapsed time:', elapsed);
      } else if (document.visibilityState === 'hidden' && isActive) {
        // Save state when going to background
        saveTimerState();
        log.log('Tab hidden, saved timer state');
      }
    };

    const handleFocus = () => {
      if (isActive && startTimeRef.current !== null) {
        const elapsed = calculateElapsed();
        setSeconds(elapsed);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isActive, calculateElapsed, saveTimerState]);

  // Main timer effect
  useEffect(() => {
    if (isActive) {
      // Check if we have a saved state to restore
      const savedState = loadTimerState();
      if (savedState && startTimeRef.current === null) {
        // Restore from saved state - timer was running before
        startTimeRef.current = savedState.startTime;
        accumulatedRef.current = savedState.accumulated;
        log.log('Restored timer state:', savedState);
      } else if (startTimeRef.current === null) {
        // Fresh start
        startTimeRef.current = Date.now();
        accumulatedRef.current = 0;
        log.log('Started fresh timer');
      }
      
      // Start the update loop
      animationFrameRef.current = requestAnimationFrame(updateTimer);
    } else {
      // Timer stopped - cancel animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isActive, loadTimerState, updateTimer]);

  // Save state periodically while active (every 5 seconds)
  useEffect(() => {
    if (!isActive) return;

    const saveInterval = setInterval(() => {
      saveTimerState();
    }, 5000);

    return () => clearInterval(saveInterval);
  }, [isActive, saveTimerState]);

  const reset = useCallback(() => {
    startTimeRef.current = null;
    accumulatedRef.current = 0;
    setSeconds(0);
    clearTimerState();
    log.log('Timer reset');
  }, [clearTimerState]);

  const formatTime = useCallback(() => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, [seconds]);

  return { seconds, formatTime, reset };
}

/**
 * Hook for rest timer (countdown)
 */
export function useRestTimer(initialTime = 90) {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [duration, setDuration] = useState(initialTime);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const start = useCallback(() => {
    setTimeLeft(duration);
    setIsActive(true);
  }, [duration]);

  const stop = useCallback(() => {
    setIsActive(false);
  }, []);

  const toggle = useCallback(() => {
    if (!isActive) {
      setTimeLeft(duration);
    }
    setIsActive(!isActive);
  }, [isActive, duration]);

  const adjustDuration = useCallback((delta) => {
    const newDuration = Math.max(15, Math.min(300, duration + delta));
    setDuration(newDuration);
    if (!isActive) {
      setTimeLeft(newDuration);
    }
  }, [duration, isActive]);

  const progress = duration > 0 ? (timeLeft / duration) * 100 : 0;

  const formatTimeLeft = useCallback(() => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, [timeLeft]);

  return {
    isActive,
    timeLeft,
    duration,
    progress,
    start,
    stop,
    toggle,
    adjustDuration,
    formatTimeLeft,
    isComplete: timeLeft === 0 && !isActive,
  };
}

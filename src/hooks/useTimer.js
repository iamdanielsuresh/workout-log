import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for workout duration timer
 */
export function useTimer(isActive = false) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const reset = useCallback(() => setSeconds(0), []);

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

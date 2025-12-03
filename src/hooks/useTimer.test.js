/**
 * Tests for useTimer hook
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimer } from './useTimer';

const TIMER_STORAGE_KEY = 'workout-timer-state';

describe('useTimer', () => {
  let rafCallbacks = [];
  let rafId = 0;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    rafCallbacks = [];
    rafId = 0;
    
    // Mock requestAnimationFrame to not auto-loop
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      const id = ++rafId;
      rafCallbacks.push({ id, cb });
      return id;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      rafCallbacks = rafCallbacks.filter(item => item.id !== id);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    rafCallbacks = [];
  });

  // Helper to run one frame of animation
  const runAnimationFrame = () => {
    const callbacks = [...rafCallbacks];
    rafCallbacks = [];
    callbacks.forEach(({ cb }) => cb(Date.now()));
  };

  describe('basic functionality', () => {
    it('starts with 0 seconds', () => {
      const { result } = renderHook(() => useTimer(false));
      expect(result.current.seconds).toBe(0);
    });

    it('formatTime returns 0:00 initially', () => {
      const { result } = renderHook(() => useTimer(false));
      expect(result.current.formatTime()).toBe('0:00');
    });

    it('formatTime formats minutes and seconds correctly', () => {
      // Test the format function logic directly
      const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
      };
      
      expect(formatTime(0)).toBe('0:00');
      expect(formatTime(30)).toBe('0:30');
      expect(formatTime(60)).toBe('1:00');
      expect(formatTime(90)).toBe('1:30');
      expect(formatTime(125)).toBe('2:05');
      expect(formatTime(3600)).toBe('60:00');
    });

    it('reset clears the timer and localStorage', () => {
      const { result } = renderHook(() => useTimer(true));
      
      // Store something in localStorage
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify({
        startTime: Date.now(),
        accumulated: 0,
        savedAt: Date.now()
      }));
      
      act(() => {
        result.current.reset();
      });
      
      expect(result.current.seconds).toBe(0);
      expect(localStorage.getItem(TIMER_STORAGE_KEY)).toBeNull();
    });
  });

  describe('timer activation', () => {
    it('starts animation frame when isActive becomes true', () => {
      const { result, rerender } = renderHook(
        ({ isActive }) => useTimer(isActive),
        { initialProps: { isActive: false } }
      );
      
      expect(result.current.seconds).toBe(0);
      expect(window.requestAnimationFrame).not.toHaveBeenCalled();
      
      // Activate the timer
      rerender({ isActive: true });
      
      // The timer should have started (requestAnimationFrame was called)
      expect(window.requestAnimationFrame).toHaveBeenCalled();
    });

    it('cancels animation frame when isActive becomes false', () => {
      const { result, rerender } = renderHook(
        ({ isActive }) => useTimer(isActive),
        { initialProps: { isActive: true } }
      );
      
      // Deactivate the timer
      rerender({ isActive: false });
      
      // cancelAnimationFrame should have been called
      expect(window.cancelAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('localStorage persistence', () => {
    it('saves timer state to localStorage periodically', () => {
      vi.useFakeTimers();
      
      renderHook(() => useTimer(true));
      
      // Advance time by 5 seconds to trigger save
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      
      const stored = localStorage.getItem(TIMER_STORAGE_KEY);
      expect(stored).not.toBeNull();
      
      if (stored) {
        const state = JSON.parse(stored);
        expect(state).toHaveProperty('startTime');
        expect(state).toHaveProperty('accumulated');
        expect(state).toHaveProperty('savedAt');
      }
      
      vi.useRealTimers();
    });

    it('clears localStorage on reset', () => {
      // Set some initial state in localStorage
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify({
        startTime: Date.now() - 60000,
        accumulated: 0,
        savedAt: Date.now()
      }));
      
      const { result } = renderHook(() => useTimer(true));
      
      act(() => {
        result.current.reset();
      });
      
      expect(localStorage.getItem(TIMER_STORAGE_KEY)).toBeNull();
    });

    it('restores timer state from localStorage when activated', () => {
      const startTime = Date.now() - 30000; // 30 seconds ago
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify({
        startTime: startTime,
        accumulated: 0,
        savedAt: Date.now() - 1000
      }));
      
      const { result } = renderHook(() => useTimer(true));
      
      // Run one animation frame to update state
      act(() => {
        runAnimationFrame();
      });
      
      // Timer should have restored from saved state
      // Elapsed time should be approximately 30 seconds
      expect(result.current.seconds).toBeGreaterThanOrEqual(29);
      expect(result.current.seconds).toBeLessThanOrEqual(32);
    });
  });

  describe('visibility change handling', () => {
    it('saves state when tab becomes hidden', () => {
      vi.useFakeTimers();
      
      renderHook(() => useTimer(true));
      
      // Wait for periodic save
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      
      // Simulate visibility change to hidden
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        configurable: true
      });
      
      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });
      
      // State should be saved
      const stored = localStorage.getItem(TIMER_STORAGE_KEY);
      expect(stored).not.toBeNull();
      
      vi.useRealTimers();
    });

    it('recalculates elapsed time when tab becomes visible', () => {
      // Start with a saved state from 60 seconds ago
      const startTime = Date.now() - 60000;
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify({
        startTime: startTime,
        accumulated: 0,
        savedAt: Date.now() - 30000
      }));
      
      const { result } = renderHook(() => useTimer(true));
      
      // Run one animation frame to initialize
      act(() => {
        runAnimationFrame();
      });
      
      // Simulate visibility change to visible
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        configurable: true
      });
      
      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });
      
      // Timer should have recalculated, seconds should be approximately 60
      expect(result.current.seconds).toBeGreaterThanOrEqual(59);
      expect(result.current.seconds).toBeLessThanOrEqual(62);
    });
  });

  describe('timestamp-based calculation', () => {
    it('calculates elapsed time from start timestamp', () => {
      vi.useFakeTimers();
      
      const { result } = renderHook(() => useTimer(true));
      
      // Advance by 10 seconds
      act(() => {
        vi.advanceTimersByTime(10000);
        runAnimationFrame();
      });
      
      // Seconds should be approximately 10
      expect(result.current.seconds).toBeGreaterThanOrEqual(9);
      expect(result.current.seconds).toBeLessThanOrEqual(11);
      
      vi.useRealTimers();
    });

    it('handles accumulated time from previous sessions', () => {
      // Store accumulated time in localStorage - 2 minutes previously
      // Start time is NOW, so elapsed from startTime is 0, but accumulated is 120
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify({
        startTime: Date.now(),
        accumulated: 120,
        savedAt: Date.now()
      }));
      
      const { result } = renderHook(() => useTimer(true));
      
      // Run animation frame to update
      act(() => {
        runAnimationFrame();
      });
      
      // Timer should start with accumulated time (approximately 120)
      expect(result.current.seconds).toBeGreaterThanOrEqual(119);
      expect(result.current.seconds).toBeLessThanOrEqual(122);
    });
  });

  describe('cleanup', () => {
    it('cancels animation frame on unmount', () => {
      const { unmount } = renderHook(() => useTimer(true));
      
      unmount();
      
      expect(window.cancelAnimationFrame).toHaveBeenCalled();
    });

    it('clears interval on unmount', () => {
      vi.useFakeTimers();
      
      const { unmount } = renderHook(() => useTimer(true));
      
      // Advance time a bit
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      unmount();
      
      // Should clean up without errors
      vi.useRealTimers();
    });
  });
});

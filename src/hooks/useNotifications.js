import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { createLogger } from '../utils/logger';

const log = createLogger('useNotifications');

/**
 * Default notification settings
 */
const DEFAULT_SETTINGS = {
  workout_reminders_enabled: true,
  streak_alerts_enabled: true,
  motivation_enabled: true,
  reminder_time: '09:00',
  reminder_days: [1, 2, 3, 4, 5] // Mon-Fri
};

/**
 * Hook for managing notification settings
 * Task 7: Notifications System
 */
export function useNotifications(userId) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('default');

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    } else {
      setPermissionStatus('unsupported');
    }
  }, []);

  // Fetch notification settings
  const fetchSettings = useCallback(async () => {
    if (!userId) return;

    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (data) {
        setSettings({
          workout_reminders_enabled: data.workout_reminders_enabled ?? true,
          streak_alerts_enabled: data.streak_alerts_enabled ?? true,
          motivation_enabled: data.motivation_enabled ?? true,
          reminder_time: data.reminder_time?.slice(0, 5) || '09:00',
          reminder_days: data.reminder_days || [1, 2, 3, 4, 5]
        });
      } else {
        // Use defaults for new users
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (err) {
      log.error('Error fetching notification settings:', err);
      setError(err.message || 'Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    if (!userId) {
      setSettings(DEFAULT_SETTINGS);
      setLoading(false);
      return;
    }

    fetchSettings();
  }, [userId, fetchSettings]);

  // Save notification settings
  const saveSettings = useCallback(async (newSettings) => {
    if (!userId) throw new Error('No user ID');

    // Optimistic update
    const previousSettings = settings;
    setSettings(prev => ({ ...prev, ...newSettings }));

    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: userId,
          workout_reminders_enabled: newSettings.workout_reminders_enabled,
          streak_alerts_enabled: newSettings.streak_alerts_enabled,
          motivation_enabled: newSettings.motivation_enabled,
          reminder_time: newSettings.reminder_time + ':00',
          reminder_days: newSettings.reminder_days,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      log.log('Notification settings saved');
      return data;
    } catch (err) {
      // Revert on error
      setSettings(previousSettings);
      log.error('Error saving notification settings:', err);
      throw err;
    }
  }, [userId, settings]);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      return 'unsupported';
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      return permission;
    } catch (err) {
      log.error('Error requesting notification permission:', err);
      return 'denied';
    }
  }, []);

  // Send a test notification
  const sendTestNotification = useCallback(async (title, body, options = {}) => {
    if (permissionStatus !== 'granted') {
      log.warn('Notification permission not granted');
      return false;
    }

    try {
      const notification = new Notification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: options.tag || 'workout-log',
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return true;
    } catch (err) {
      log.error('Error sending notification:', err);
      return false;
    }
  }, [permissionStatus]);

  // Schedule a reminder notification (using Service Worker if available)
  const scheduleReminder = useCallback(async (title, body, scheduledTime) => {
    // For now, we'll use a simple timeout-based approach
    // In a production app, you'd use Service Workers with the Push API
    const now = new Date();
    const delay = scheduledTime.getTime() - now.getTime();
    
    if (delay <= 0) return null;

    const timeoutId = setTimeout(() => {
      sendTestNotification(title, body, { tag: 'reminder' });
    }, delay);

    return timeoutId;
  }, [sendTestNotification]);

  // Computed properties
  const canNotify = permissionStatus === 'granted';
  const isSupported = 'Notification' in window;

  return {
    settings,
    loading,
    error,
    saveSettings,
    requestPermission,
    sendTestNotification,
    scheduleReminder,
    permissionStatus,
    canNotify,
    isSupported,
    refresh: fetchSettings,
    clearError: () => setError(null)
  };
}

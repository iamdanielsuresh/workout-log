import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { createLogger } from '../utils/logger';

const log = createLogger('useSettings');

/**
 * Hook for managing user settings (AI preferences, etc.)
 */
export function useSettings(userId) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch settings when userId changes
  useEffect(() => {
    if (!userId) {
      setSettings(null);
      setLoading(false);
      return;
    }

    const fetchSettings = async () => {
      log.log('Fetching settings for user:', userId);
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        log.error('Error fetching settings:', error);
      }

      log.log('Fetched settings:', data);
      setSettings(data || null);
      setLoading(false);
    };

    fetchSettings();
  }, [userId]);

  // Save settings
  const saveSettings = useCallback(async (newSettings) => {
    if (!userId) {
      log.error('Cannot save - no user ID');
      throw new Error('No user ID available');
    }

    log.log('Saving settings for user:', userId, newSettings);

    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        ...newSettings,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      log.error('Error saving settings:', error);
      throw error;
    }

    log.log('Settings saved successfully:', data);
    setSettings(data);
    return data;
  }, [userId]);

  // Convenience getters
  const aiEnabled = settings?.ai_enabled || false;
  const apiKey = settings?.google_api_key || null;
  const onboardingCompleted = settings?.onboarding_completed || false;

  // Debug log
  useEffect(() => {
    log.log('State updated:', { 
      loading, 
      hasSettings: !!settings, 
      onboardingCompleted,
      aiEnabled 
    });
  }, [loading, settings, onboardingCompleted, aiEnabled]);

  return {
    settings,
    loading,
    saveSettings,
    aiEnabled,
    apiKey,
    onboardingCompleted,
  };
}

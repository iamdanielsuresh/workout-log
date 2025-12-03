import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { createLogger } from '../utils/logger';

const log = createLogger('useProfile');

/**
 * Hook for managing user profile data
 */
export function useProfile(userId) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch profile when userId changes
  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      log.log('Fetching profile for user:', userId);
      setError(null);
      
      try {
        const { data, error: fetchError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        log.log('Fetched profile:', data);
        setProfile(data || null);
      } catch (err) {
        log.error('Error fetching profile:', err);
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  // Save profile
  const saveProfile = useCallback(async (profileData) => {
    if (!userId) {
      log.error('Cannot save - no user ID');
      throw new Error('No user ID available');
    }

    log.log('Saving profile for user:', userId, profileData);

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        ...profileData,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      log.error('Error saving profile:', error);
      throw error;
    }

    log.log('Profile saved successfully:', data);
    setProfile(data);
    return data;
  }, [userId]);

  // Delete profile
  const deleteProfile = useCallback(async () => {
    if (!userId) return;

    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', userId);

    if (error) {
      log.error('Error deleting profile:', error);
      throw error;
    }

    setProfile(null);
  }, [userId]);

  // Computed properties
  const hasProfile = !!profile?.display_name;
  const displayName = profile?.display_name || null;
  const experienceLevel = profile?.experience_level || null;

  return {
    profile,
    loading,
    error,
    saveProfile,
    deleteProfile,
    hasProfile,
    displayName,
    experienceLevel,
    clearError: () => setError(null),
  };
}

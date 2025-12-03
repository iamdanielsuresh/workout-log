import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { createLogger } from '../utils/logger';

const log = createLogger('useAuth');

/**
 * Hook for managing Supabase authentication
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      log.log('Initial session:', session?.user?.id, session?.user?.email);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      log.log('Auth state changed:', _event, session?.user?.id, session?.user?.email);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
  }, []);

  const signInAnonymously = useCallback(async () => {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const deleteAccount = useCallback(async () => {
    // First delete all user data from our tables
    const userId = user?.id;
    if (!userId) throw new Error('No user logged in');

    // Delete profile, settings, workout plans, and logs
    // These will cascade due to RLS, but we'll do it explicitly for safety
    await Promise.all([
      supabase.from('user_profiles').delete().eq('user_id', userId),
      supabase.from('user_settings').delete().eq('user_id', userId),
      supabase.from('workout_plans').delete().eq('user_id', userId),
      supabase.from('workout_logs').delete().eq('user_id', userId),
    ]);

    // Sign out (Note: actual user deletion from auth.users requires admin API or Edge Function)
    await supabase.auth.signOut();
  }, [user]);

  // Helper properties
  const userName = user?.user_metadata?.full_name?.split(' ')[0] 
    || user?.user_metadata?.name?.split(' ')[0] 
    || 'there';
  const userPhoto = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const isAnonymous = user?.is_anonymous;

  return {
    user,
    loading,
    userName,
    userPhoto,
    isAnonymous,
    signInWithGoogle,
    signInAnonymously,
    signOut,
    deleteAccount,
  };
}

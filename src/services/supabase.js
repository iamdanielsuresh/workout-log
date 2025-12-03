import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Debug: log the Supabase URL to verify configuration
console.log('[Supabase] Initializing with URL:', supabaseUrl?.substring(0, 30) + '...');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'workout-log-auth',
    storage: window.localStorage,
    flowType: 'pkce',
  }
});

// Exercises
export const getExercises = async () => {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data;
};

export const createExercise = async (exercise) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('exercises')
    .insert([{
      ...exercise,
      user_id: user.id,
      is_custom: true
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

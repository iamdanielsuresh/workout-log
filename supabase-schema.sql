-- Supabase SQL Schema for Workout Log App
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

-- Create user_profiles table (stores user profile info from onboarding)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  date_of_birth DATE,
  age INTEGER,
  height DECIMAL(5,2), -- in cm
  weight DECIMAL(5,2), -- in kg
  body_fat DECIMAL(4,1), -- percentage
  photo_url TEXT,
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'professional')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workout_plans table (user-configurable workout templates)
CREATE TABLE IF NOT EXISTS workout_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id TEXT NOT NULL, -- e.g., 'push', 'pull', 'day1'
  name TEXT NOT NULL,
  description TEXT,
  next_plan TEXT, -- links to next plan_id in rotation
  est_time TEXT,
  exercises JSONB NOT NULL DEFAULT '[]',
  source TEXT CHECK (source IN ('template', 'ai-generated', 'custom')) DEFAULT 'custom',
  template_id TEXT, -- if derived from a template
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, plan_id)
);

-- Create the workout_logs table
CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workout_type TEXT NOT NULL,
  workout_name TEXT NOT NULL,
  exercises JSONB NOT NULL DEFAULT '[]',
  note TEXT,
  duration INTEGER, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_settings table for storing AI API key and preferences
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  ai_enabled BOOLEAN DEFAULT false,
  google_api_key TEXT, -- encrypted in production, stored securely
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS workout_plans_user_id_idx ON workout_plans(user_id);
CREATE INDEX IF NOT EXISTS workout_logs_user_id_idx ON workout_logs(user_id);
CREATE INDEX IF NOT EXISTS workout_logs_created_at_idx ON workout_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS user_settings_user_id_idx ON user_settings(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON user_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for workout_plans
CREATE POLICY "Users can view own workout plans" ON workout_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout plans" ON workout_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout plans" ON workout_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout plans" ON workout_plans
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for workout_logs
CREATE POLICY "Users can view own workout logs" ON workout_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout logs" ON workout_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout logs" ON workout_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout logs" ON workout_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for user_settings
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Enable Realtime for the tables (optional, for live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE workout_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE workout_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE user_settings;

-- Function to delete user account and all data
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete all user data (cascades via foreign keys)
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

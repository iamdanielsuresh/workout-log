-- ============================================================
-- Supabase RLS Reset and Verification Script for Workout Log App
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Step 1: Drop existing policies (if they exist)
-- ============================================================

DO $$ 
BEGIN
    -- Drop user_profiles policies
    DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;
    
    -- Drop user_settings policies
    DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
    DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
    DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
    DROP POLICY IF EXISTS "Users can delete own settings" ON user_settings;
    
    -- Drop workout_plans policies
    DROP POLICY IF EXISTS "Users can view own workout plans" ON workout_plans;
    DROP POLICY IF EXISTS "Users can insert own workout plans" ON workout_plans;
    DROP POLICY IF EXISTS "Users can update own workout plans" ON workout_plans;
    DROP POLICY IF EXISTS "Users can delete own workout plans" ON workout_plans;
    
    -- Drop workout_logs policies
    DROP POLICY IF EXISTS "Users can view own workout logs" ON workout_logs;
    DROP POLICY IF EXISTS "Users can insert own workout logs" ON workout_logs;
    DROP POLICY IF EXISTS "Users can update own workout logs" ON workout_logs;
    DROP POLICY IF EXISTS "Users can delete own workout logs" ON workout_logs;
    
EXCEPTION WHEN OTHERS THEN
    -- Ignore errors if policies don't exist
    NULL;
END $$;

-- Step 2: Ensure tables exist with correct schema
-- ============================================================

-- user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  date_of_birth DATE,
  age INTEGER,
  height DECIMAL(5,2),
  weight DECIMAL(5,2),
  body_fat DECIMAL(4,1),
  photo_url TEXT,
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'professional')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  ai_enabled BOOLEAN DEFAULT false,
  google_api_key TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- workout_plans table
CREATE TABLE IF NOT EXISTS workout_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  next_plan TEXT,
  est_time TEXT,
  exercises JSONB NOT NULL DEFAULT '[]',
  source TEXT CHECK (source IN ('template', 'ai-generated', 'custom')) DEFAULT 'custom',
  template_id TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, plan_id)
);

-- workout_logs table
CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workout_type TEXT NOT NULL,
  workout_name TEXT NOT NULL,
  exercises JSONB NOT NULL DEFAULT '[]',
  note TEXT,
  duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Enable RLS on all tables
-- ============================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS Policies for user_profiles
-- ============================================================

CREATE POLICY "Users can view own profile" 
ON user_profiles FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" 
ON user_profiles FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
ON user_profiles FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" 
ON user_profiles FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Step 5: Create RLS Policies for user_settings
-- ============================================================

CREATE POLICY "Users can view own settings" 
ON user_settings FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" 
ON user_settings FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" 
ON user_settings FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings" 
ON user_settings FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Step 6: Create RLS Policies for workout_plans
-- ============================================================

CREATE POLICY "Users can view own workout plans" 
ON workout_plans FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout plans" 
ON workout_plans FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout plans" 
ON workout_plans FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout plans" 
ON workout_plans FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Step 7: Create RLS Policies for workout_logs
-- ============================================================

CREATE POLICY "Users can view own workout logs" 
ON workout_logs FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout logs" 
ON workout_logs FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout logs" 
ON workout_logs FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout logs" 
ON workout_logs FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Step 8: Create indexes for performance
-- ============================================================

CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS user_settings_user_id_idx ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS workout_plans_user_id_idx ON workout_plans(user_id);
CREATE INDEX IF NOT EXISTS workout_logs_user_id_idx ON workout_logs(user_id);
CREATE INDEX IF NOT EXISTS workout_logs_created_at_idx ON workout_logs(created_at DESC);

-- Step 9: Verify setup - Run this to check everything is correct
-- ============================================================

-- Check RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'user_settings', 'workout_plans', 'workout_logs');

-- Check policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Step 10: Test query (replace YOUR_USER_ID with actual user ID from auth.users)
-- ============================================================
-- SELECT * FROM auth.users LIMIT 5;  -- Run this to see user IDs
-- SELECT * FROM user_profiles WHERE user_id = 'YOUR_USER_ID';

-- Supabase SQL Schema for Workout Log App
-- Combined Schema (Base + Features + Migrations)

-- ==========================================
-- 1. Core Tables
-- ==========================================

-- user_profiles
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
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  country TEXT,
  timezone TEXT,
  goals TEXT,
  training_age INTEGER,
  injuries TEXT,
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- user_settings
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  ai_enabled BOOLEAN DEFAULT false,
  google_api_key TEXT, -- encrypted in production
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- workout_folders
CREATE TABLE IF NOT EXISTS workout_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'emerald',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- workout_plans
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
  folder_id UUID REFERENCES workout_folders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, plan_id)
);

-- workout_logs
CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workout_type TEXT NOT NULL,
  workout_name TEXT NOT NULL,
  exercises JSONB NOT NULL DEFAULT '[]',
  note TEXT,
  duration INTEGER, -- in seconds
  start_time TIMESTAMP WITH TIME ZONE,
  workout_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- exercises
CREATE TABLE IF NOT EXISTS exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  muscle_group TEXT,
  equipment TEXT,
  description TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Nullable. If null, it's a global exercise.
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ai_notes
CREATE TABLE IF NOT EXISTS ai_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message_text TEXT NOT NULL,
  category TEXT CHECK (category IN ('motivation', 'insight', 'tip', 'chat', 'workout', 'other')) DEFAULT 'other',
  source TEXT DEFAULT 'chat',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- notification_settings
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  workout_reminders_enabled BOOLEAN DEFAULT true,
  streak_alerts_enabled BOOLEAN DEFAULT true,
  motivation_enabled BOOLEAN DEFAULT true,
  reminder_time TIME DEFAULT '09:00:00',
  reminder_days INTEGER[] DEFAULT '{1,2,3,4,5}',
  last_notification_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- exercise_tips_cache
CREATE TABLE IF NOT EXISTS exercise_tips_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_name TEXT NOT NULL,
  experience_level TEXT DEFAULT 'intermediate',
  form_description TEXT,
  key_cues JSONB DEFAULT '[]',
  common_mistakes JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(exercise_name, experience_level)
);

-- ==========================================
-- 2. Indexes
-- ==========================================

CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS workout_plans_user_id_idx ON workout_plans(user_id);
CREATE INDEX IF NOT EXISTS workout_plans_folder_id_idx ON workout_plans(folder_id);
CREATE INDEX IF NOT EXISTS workout_logs_user_id_idx ON workout_logs(user_id);
CREATE INDEX IF NOT EXISTS workout_logs_created_at_idx ON workout_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS workout_logs_workout_date_idx ON workout_logs(workout_date);
CREATE INDEX IF NOT EXISTS user_settings_user_id_idx ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS exercises_user_id_idx ON exercises(user_id);
CREATE INDEX IF NOT EXISTS exercises_name_idx ON exercises(name);
CREATE INDEX IF NOT EXISTS ai_notes_user_id_idx ON ai_notes(user_id);
CREATE INDEX IF NOT EXISTS ai_notes_category_idx ON ai_notes(category);
CREATE INDEX IF NOT EXISTS ai_notes_created_at_idx ON ai_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS notification_settings_user_id_idx ON notification_settings(user_id);

-- ==========================================
-- 3. Row Level Security (RLS)
-- ==========================================

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Policies

-- user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON user_profiles FOR DELETE USING (auth.uid() = user_id);

-- workout_plans
CREATE POLICY "Users can view own workout plans" ON workout_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workout plans" ON workout_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workout plans" ON workout_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workout plans" ON workout_plans FOR DELETE USING (auth.uid() = user_id);

-- workout_logs
CREATE POLICY "Users can view own workout logs" ON workout_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workout logs" ON workout_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workout logs" ON workout_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workout logs" ON workout_logs FOR DELETE USING (auth.uid() = user_id);

-- user_settings
CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own settings" ON user_settings FOR DELETE USING (auth.uid() = user_id);

-- workout_folders
CREATE POLICY "Users can view own folders" ON workout_folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own folders" ON workout_folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own folders" ON workout_folders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own folders" ON workout_folders FOR DELETE USING (auth.uid() = user_id);

-- exercises
CREATE POLICY "Everyone can view global exercises" ON exercises FOR SELECT USING (user_id IS NULL);
CREATE POLICY "Users can view own exercises" ON exercises FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own exercises" ON exercises FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own exercises" ON exercises FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own exercises" ON exercises FOR DELETE USING (auth.uid() = user_id);

-- ai_notes
CREATE POLICY "Users can view own notes" ON ai_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes" ON ai_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON ai_notes FOR DELETE USING (auth.uid() = user_id);

-- notification_settings
CREATE POLICY "Users can view own notification settings" ON notification_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notification settings" ON notification_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notification settings" ON notification_settings FOR UPDATE USING (auth.uid() = user_id);

-- ==========================================
-- 4. Seed Data
-- ==========================================

INSERT INTO exercises (name, muscle_group, equipment, description) VALUES
('Bench Press', 'Chest', 'Barbell', 'Compound chest exercise'),
('Push Up', 'Chest', 'Bodyweight', 'Classic bodyweight chest exercise'),
('Incline Dumbbell Press', 'Chest', 'Dumbbell', 'Upper chest focus'),
('Cable Fly', 'Chest', 'Cable', 'Chest isolation'),
('Dips', 'Chest', 'Bodyweight', 'Lower chest and triceps'),
('Overhead Press', 'Shoulders', 'Barbell', 'Compound shoulder exercise'),
('Lateral Raise', 'Shoulders', 'Dumbbell', 'Side delt isolation'),
('Face Pull', 'Shoulders', 'Cable', 'Rear delt and rotator cuff'),
('Front Raise', 'Shoulders', 'Dumbbell', 'Front delt isolation'),
('Pull Up', 'Back', 'Bodyweight', 'Vertical pulling for back width'),
('Lat Pulldown', 'Back', 'Machine', 'Vertical pulling machine'),
('Barbell Row', 'Back', 'Barbell', 'Horizontal pulling for thickness'),
('Seated Cable Row', 'Back', 'Cable', 'Horizontal pulling machine'),
('Deadlift', 'Back', 'Barbell', 'Full body posterior chain'),
('Squat', 'Legs', 'Barbell', 'King of leg exercises'),
('Leg Press', 'Legs', 'Machine', 'Heavy leg compound'),
('Lunges', 'Legs', 'Dumbbell', 'Unilateral leg exercise'),
('Leg Extension', 'Legs', 'Machine', 'Quad isolation'),
('Leg Curl', 'Legs', 'Machine', 'Hamstring isolation'),
('Calf Raise', 'Legs', 'Machine', 'Calf isolation'),
('Romanian Deadlift', 'Legs', 'Barbell', 'Hamstring and glute focus'),
('Bulgarian Split Squat', 'Legs', 'Dumbbell', 'Unilateral leg builder'),
('Bicep Curl', 'Arms', 'Dumbbell', 'Bicep isolation'),
('Hammer Curl', 'Arms', 'Dumbbell', 'Brachialis and forearm'),
('Tricep Pushdown', 'Arms', 'Cable', 'Tricep isolation'),
('Skull Crusher', 'Arms', 'Barbell', 'Tricep isolation'),
('Preacher Curl', 'Arms', 'Machine', 'Bicep isolation'),
('Plank', 'Core', 'Bodyweight', 'Core stability'),
('Crunch', 'Core', 'Bodyweight', 'Abdominal isolation'),
('Leg Raise', 'Core', 'Bodyweight', 'Lower abs'),
('Russian Twist', 'Core', 'Bodyweight', 'Obliques'),
('Mountain Climber', 'Core', 'Bodyweight', 'Dynamic core'),
('Burpee', 'Cardio', 'Bodyweight', 'Full body conditioning'),
('Jumping Jack', 'Cardio', 'Bodyweight', 'Warmup cardio'),
('Box Jump', 'Legs', 'Box', 'Explosive power'),
('Kettlebell Swing', 'Legs', 'Kettlebell', 'Posterior chain power'),
('Clean and Jerk', 'Full Body', 'Barbell', 'Olympic lift'),
('Snatch', 'Full Body', 'Barbell', 'Olympic lift'),
('Farmer Walk', 'Full Body', 'Dumbbell', 'Grip and core'),
('Hip Thrust', 'Legs', 'Barbell', 'Glute isolation'),
('Glute Bridge', 'Legs', 'Bodyweight', 'Glute activation'),
('Cable Woodchopper', 'Core', 'Cable', 'Rotational core'),
('T-Bar Row', 'Back', 'Barbell', 'Mid back thickness'),
('Chin Up', 'Back', 'Bodyweight', 'Back and biceps'),
('Incline Bench Press', 'Chest', 'Barbell', 'Upper chest'),
('Decline Bench Press', 'Chest', 'Barbell', 'Lower chest'),
('Arnold Press', 'Shoulders', 'Dumbbell', 'Shoulder compound'),
('Shrugs', 'Shoulders', 'Dumbbell', 'Traps'),
('Reverse Fly', 'Shoulders', 'Dumbbell', 'Rear delts'),
('Tricep Kickback', 'Arms', 'Dumbbell', 'Tricep isolation');

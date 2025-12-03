-- SQL Migration for Workout Log Enhancement
-- This adds new columns and tables for Tasks 1-10

-- ==========================================
-- TASK 1: Country/Region & Timezone for AI awareness
-- ==========================================
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS timezone TEXT;

-- ==========================================
-- TASK 6: Extended Health Metrics
-- ==========================================
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS goals TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS training_age INTEGER;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS injuries TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active'));

-- ==========================================
-- TASK 2: AI Notes Table
-- ==========================================
CREATE TABLE IF NOT EXISTS ai_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message_text TEXT NOT NULL,
  category TEXT CHECK (category IN ('motivation', 'insight', 'tip', 'chat', 'workout', 'other')) DEFAULT 'other',
  source TEXT DEFAULT 'chat', -- 'chat', 'insights', 'tips', 'motivation'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_notes_user_id_idx ON ai_notes(user_id);
CREATE INDEX IF NOT EXISTS ai_notes_category_idx ON ai_notes(category);
CREATE INDEX IF NOT EXISTS ai_notes_created_at_idx ON ai_notes(created_at DESC);

-- Enable RLS for ai_notes
ALTER TABLE ai_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes" ON ai_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes" ON ai_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON ai_notes
  FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- TASK 3: Workout History With Time
-- ==========================================
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS workout_date DATE;

-- Update existing rows to have workout_date derived from created_at
UPDATE workout_logs SET workout_date = DATE(created_at) WHERE workout_date IS NULL;

-- Create index for efficient date-based queries
CREATE INDEX IF NOT EXISTS workout_logs_workout_date_idx ON workout_logs(workout_date);

-- ==========================================
-- TASK 7: Notification Settings
-- ==========================================
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  workout_reminders_enabled BOOLEAN DEFAULT true,
  streak_alerts_enabled BOOLEAN DEFAULT true,
  motivation_enabled BOOLEAN DEFAULT true,
  reminder_time TIME DEFAULT '09:00:00',
  reminder_days INTEGER[] DEFAULT '{1,2,3,4,5}', -- 0=Sunday, 1=Monday, etc.
  last_notification_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notification_settings_user_id_idx ON notification_settings(user_id);

-- Enable RLS for notification_settings
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification settings" ON notification_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings" ON notification_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings" ON notification_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- ==========================================
-- TASK 9: Exercise Form Tips Cache
-- ==========================================
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

CREATE INDEX IF NOT EXISTS exercise_tips_cache_name_idx ON exercise_tips_cache(exercise_name);

-- Enable Realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE ai_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE notification_settings;

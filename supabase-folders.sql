-- Create workout_folders table
CREATE TABLE IF NOT EXISTS workout_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'emerald',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add folder_id to workout_plans
ALTER TABLE workout_plans ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES workout_folders(id) ON DELETE SET NULL;

-- Enable RLS for workout_folders
ALTER TABLE workout_folders ENABLE ROW LEVEL SECURITY;

-- Policies for workout_folders
CREATE POLICY "Users can view own folders" ON workout_folders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own folders" ON workout_folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders" ON workout_folders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders" ON workout_folders
  FOR DELETE USING (auth.uid() = user_id);

-- Create index
CREATE INDEX IF NOT EXISTS workout_plans_folder_id_idx ON workout_plans(folder_id);

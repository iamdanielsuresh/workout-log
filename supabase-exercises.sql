-- Create exercises table
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

-- Enable RLS
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can view global exercises
CREATE POLICY "Everyone can view global exercises" ON exercises
  FOR SELECT USING (user_id IS NULL);

-- Users can view their own custom exercises
CREATE POLICY "Users can view own exercises" ON exercises
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own exercises
CREATE POLICY "Users can insert own exercises" ON exercises
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own exercises
CREATE POLICY "Users can update own exercises" ON exercises
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own exercises
CREATE POLICY "Users can delete own exercises" ON exercises
  FOR DELETE USING (auth.uid() = user_id);

-- Create index
CREATE INDEX IF NOT EXISTS exercises_user_id_idx ON exercises(user_id);
CREATE INDEX IF NOT EXISTS exercises_name_idx ON exercises(name);

-- Seed Data (Top 50 common exercises)
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
